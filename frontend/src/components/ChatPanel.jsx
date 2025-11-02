import { useState, useEffect, useRef } from 'react';
import { Send, X, Loader, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import chatService from '../services/chatService.js';
import socketService from '../services/socketService.js';
import { useAuthStore } from '../store/authStore';

const ChatPanel = ({ sessionId, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuthStore();

  // Fetch initial messages
  useEffect(() => {
    if (isOpen && sessionId) {
      loadMessages();
      joinSessionRoom();
    }

    return () => {
      if (sessionId) {
        socketService.leaveSession(sessionId);
      }
    };
  }, [isOpen, sessionId]);

  // Set up real-time message listeners
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const handleNewMessage = (data) => {
      console.log('New message received:', data);
      if (data.sessionId === sessionId || data.session_id === sessionId) {
        setMessages(prev => [...prev, {
          id: data.id,
          message: data.message,
          sender_first_name: data.senderFirstName || data.sender_first_name,
          sender_last_name: data.senderLastName || data.sender_last_name,
          sender_role: data.senderRole || data.sender_role,
          sender_id: data.senderId || data.sender_id,
          message_type: data.messageType || data.message_type || 'text',
          created_at: data.timestamp || data.created_at || new Date().toISOString()
        }]);
      }
    };

    const handleUserTyping = (data) => {
      if (data.sessionId === sessionId && data.userId !== user?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => {
            if (!prev.find(u => u.userId === data.userId)) {
              return [...prev, { userId: data.userId, userName: data.userName }];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      }
    };

    const handleUserJoined = (data) => {
      console.log('User joined:', data);
      if (data.sessionId === sessionId) {
        fetchOnlineUsers();
      }
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data);
      if (data.sessionId === sessionId) {
        fetchOnlineUsers();
      }
    };

    socketService.onMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);

    return () => {
      socketService.offMessage(handleNewMessage);
      socketService.offUserTyping(handleUserTyping);
    };
  }, [isOpen, sessionId, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await chatService.getMessages(sessionId);
      console.log('Loaded messages:', response);
      setMessages(response.data?.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinSessionRoom = () => {
    socketService.joinSession(sessionId);
    fetchOnlineUsers();
  };

  const fetchOnlineUsers = () => {
    socketService.getOnlineUsers(sessionId, (data) => {
      console.log('Online users:', data);
      setOnlineUsers(data.users || []);
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Send via API (which will trigger socket event to all users)
      await chatService.sendMessage(sessionId, messageText);
      
      // Stop typing indicator
      socketService.stopTyping(sessionId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    if (e.target.value.trim()) {
      socketService.startTyping(sessionId);

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(sessionId);
      }, 2000);
    } else {
      socketService.stopTyping(sessionId);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getRoleColor = (role) => {
    if (role?.includes('doctor')) return 'text-blue-600';
    if (role?.includes('paramedic')) return 'text-green-600';
    if (role?.includes('nurse')) return 'text-purple-600';
    if (role?.includes('driver')) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l"
      >
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Group Chat</h3>
            <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
              <Users className="w-3 h-3" />
              <span>{onlineUsers.length} online</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isOwnMessage = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwnMessage && (
                        <span className={`text-xs font-semibold mb-1 ${getRoleColor(msg.sender_role)}`}>
                          {msg.sender_first_name} {msg.sender_last_name}
                          <span className="text-gray-400 ml-1">({msg.sender_role})</span>
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-gray-900 text-white rounded-br-none'
                            : 'bg-white border text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        <span className={`text-[10px] mt-1 block ${isOwnMessage ? 'text-gray-300' : 'text-gray-500'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="text-xs text-gray-500 italic pl-2">
                  {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatPanel;
