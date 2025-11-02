import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  User,
  Check,
  CheckCheck,
  Circle,
  MessageCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { patientService } from '../../services';
import { useToast } from '../../hooks/useToast';
import io from 'socket.io-client';

export const ChatPanel = ({ sessionId, currentUser, assignedUsers = [] }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { toast } = useToast();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !sessionId) return;

    const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected for chat');
      newSocket.emit('join_session', { sessionId });
    });

    newSocket.on('joined_session', (data) => {
      console.log('Joined session:', data);
      // Get online users
      newSocket.emit('get_online_users', { sessionId });
    });

    // Listen for new messages
    newSocket.on('new_message', (data) => {
      console.log('New message received:', data);
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          senderId: data.senderId,
          senderFirstName: data.senderFirstName,
          senderLastName: data.senderLastName,
          senderRole: data.senderRole,
          message: data.message,
          messageType: data.messageType || 'text',
          metadata: data.metadata,
          createdAt: data.createdAt,
          readBy: [],
        },
      ]);
    });

    // Listen for typing indicators
    newSocket.on('user_typing', (data) => {
      if (data.userId !== currentUser.id) {
        if (data.isTyping) {
          setTypingUsers((prev) => [...new Set([...prev, data.userName])]);
        } else {
          setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
        }
      }
    });

    // Listen for online users
    newSocket.on('online_users', (data) => {
      console.log('Online users:', data.users);
      setOnlineUsers(data.users);
    });

    // Listen for user join/leave
    newSocket.on('user_joined', (data) => {
      console.log('User joined:', data);
      setOnlineUsers((prev) => [
        ...prev,
        {
          id: data.userId,
          firstName: data.userName.split(' ')[0],
          lastName: data.userName.split(' ')[1] || '',
          role: data.userRole,
        },
      ]);
    });

    newSocket.on('user_left', (data) => {
      console.log('User left:', data);
      setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
    });

    // Listen for read receipts
    newSocket.on('message_read', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, readBy: [...(msg.readBy || []), data.userId] }
            : msg
        )
      );
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to chat');
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_session', { sessionId });
      newSocket.disconnect();
    };
  }, [sessionId, currentUser.id, toast]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await patientService.getSessionMessages(sessionId, { limit: 100 });
        const fetchedMessages = response.data?.data?.messages || response.data?.messages || [];
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast.error('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchMessages();
    }
  }, [sessionId, toast]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing_start', { sessionId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { sessionId });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await patientService.sendSessionMessage(sessionId, {
        message: newMessage.trim(),
        messageType: 'text',
      });
      setNewMessage('');
      
      // Stop typing indicator
      if (socket) {
        socket.emit('typing_stop', { sessionId });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role) => {
    // All roles use gray in black & white theme
    return 'text-gray-900';
  };

  const getRoleBadgeColor = (role) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower.includes('doctor')) return 'bg-gray-900 text-white';
    if (roleLower.includes('paramedic')) return 'bg-gray-700 text-white';
    if (roleLower.includes('driver')) return 'bg-gray-500 text-white';
    return 'bg-gray-300 text-gray-900';
  };

  const isOnline = (userId) => {
    return onlineUsers.some((u) => u.id === userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-secondary">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border-2 border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-200">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Trip Chat</h3>
          <span className="text-xs text-secondary">
            ({assignedUsers.length} staff assigned)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-2 h-2 fill-gray-900 text-gray-900" />
          <span className="text-xs text-secondary">
            {onlineUsers.length} online
          </span>
        </div>
      </div>

      {/* Online Staff List */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <p className="text-xs font-medium text-secondary mb-2">Assigned Staff:</p>
        <div className="flex flex-wrap gap-2">
          {assignedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200"
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                {isOnline(user.id) && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-gray-900 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <p className="text-xs font-medium">
                  {user.first_name || user.firstName} {user.last_name || user.lastName}
                </p>
                <p className={`text-xs ${getRoleColor(user.role)}`}>
                  {(user.role || '').replace('_', ' ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-secondary">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation with your team</p>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((msg) => {
                const isOwn = msg.senderId === currentUser.id;
                const senderName = msg.sender_first_name
                  ? `${msg.sender_first_name} ${msg.sender_last_name}`
                  : `${msg.senderFirstName} ${msg.senderLastName}`;
                const senderRole = msg.sender_role || msg.senderRole;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          <span className="text-xs font-medium">{senderName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(senderRole)}`}>
                            {(senderRole || '').replace('_', ' ')}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-black text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-xs text-secondary">
                          {formatTime(msg.created_at || msg.createdAt)}
                        </span>
                        {isOwn && (
                          <>
                            {msg.readBy && msg.readBy.length > 0 ? (
                              <CheckCheck className="w-3 h-3 text-gray-900" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-400" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-secondary text-sm"
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
                <span>{typingUsers.join(', ')} typing...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-gray-200">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

ChatPanel.propTypes = {
  sessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
  assignedUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      first_name: PropTypes.string,
      firstName: PropTypes.string,
      last_name: PropTypes.string,
      lastName: PropTypes.string,
      role: PropTypes.string,
    })
  ),
};

ChatPanel.defaultProps = {
  assignedUsers: [],
};
