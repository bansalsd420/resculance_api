.PHONY: help install migrate migrate-all seed seed-all reset setup db-setup db-setup-force db-setup-ci start dev dev-frontend dev-all stop clean test check-db status

# Colors for terminal output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)╔════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║   Resculance API - Available Commands     ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Install all dependencies
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)✅ All dependencies installed!$(NC)"

migrate: ## Run legacy database migration (use migrate-all instead)
	@echo "$(YELLOW)⚠️  Using legacy migration. Recommend using 'make migrate-all'$(NC)"
	@node src/database/migrate.js
	@echo "$(GREEN)✅ Migration completed!$(NC)"

migrate-all: ## Run all database migrations (RECOMMENDED)
	@echo "$(BLUE)🔄 Running all database migrations...$(NC)"
	@node src/database/migrate-all.js
	@echo "$(GREEN)✅ All migrations completed!$(NC)"

seed: ## Seed database with basic data (legacy)
	@echo "$(YELLOW)⚠️  Using legacy seed. Recommend using 'make seed-all'$(NC)"
	@node src/database/seed.js
	@echo "$(GREEN)✅ Seeding completed!$(NC)"

seed-all: ## Seed database with comprehensive data (RECOMMENDED)
	@echo "$(BLUE)🌱 Seeding database with comprehensive data...$(NC)"
	@node src/database/seed-all.js
	@echo "$(GREEN)✅ Database seeded successfully!$(NC)"

reset: ## Reset database (drops all data)
	@echo "$(RED)╔════════════════════════════════════════════╗$(NC)"
	@echo "$(RED)║      ⚠️  WARNING: DATA DELETION!  ⚠️        ║$(NC)"
	@echo "$(RED)╚════════════════════════════════════════════╝$(NC)"
	@echo "$(YELLOW)This will permanently delete ALL database data!$(NC)"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(BLUE)🔄 Resetting database...$(NC)"; \
		node src/database/reset.js; \
		echo "$(GREEN)✅ Database reset completed!$(NC)"; \
	else \
		echo "$(YELLOW)Reset cancelled.$(NC)"; \
	fi

setup: ## Legacy full setup (use db-setup instead)
	@echo "$(YELLOW)⚠️  Using legacy setup. Recommend using 'make db-setup'$(NC)"
	@node src/database/reset.js
	@node src/database/migrate.js
	@node src/database/seed-comprehensive.js
	@echo "$(GREEN)✅ Database setup completed!$(NC)"

db-setup: ## Complete database setup: Reset -> Migrate-All -> Seed-All (RECOMMENDED)
	@echo "$(BLUE)╔════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║      Starting Full Database Setup         ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(RED)⚠️  WARNING: This will delete all existing data!$(NC)"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(BLUE)Step 1/3: Resetting database...$(NC)"; \
		node src/database/reset.js; \
		echo "$(BLUE)Step 2/3: Running migrations...$(NC)"; \
		node src/database/migrate-all.js; \
		echo "$(BLUE)Step 3/3: Seeding data...$(NC)"; \
		node src/database/seed-all.js; \
		echo ""; \
		echo "$(GREEN)╔════════════════════════════════════════════╗$(NC)"; \
		echo "$(GREEN)║     ✅ Database Setup Completed! ✅        ║$(NC)"; \
		echo "$(GREEN)╚════════════════════════════════════════════╝$(NC)"; \
		echo ""; \
		echo "$(BLUE)📝 Login Credentials:$(NC)"; \
		echo "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"; \
		echo "$(GREEN)Superadmin:$(NC)"; \
		echo "  Email: superadmin@resculance.com"; \
		echo "  Password: Super@123"; \
		echo ""; \
		echo "$(GREEN)AIIMS Delhi (Hospital Admin):$(NC)"; \
		echo "  Email: admin@aiims.delhi"; \
		echo "  Password: Admin@123"; \
		echo ""; \
		echo "$(GREEN)FastAid Fleet (Fleet Admin):$(NC)"; \
		echo "  Email: admin@fastaid.com"; \
		echo "  Password: Admin@123"; \
		echo "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"; \
	else \
		echo "$(YELLOW)Setup cancelled.$(NC)"; \
	fi

db-setup-force db-setup-ci: ## Non-interactive full setup (CI): Reset -> Migrate-All -> Seed-All (DANGEROUS)
	@echo "$(RED)⚠️  Running non-interactive DB setup (drops ALL data)$(NC)"
	@node src/database/reset.js
	@node src/database/migrate-all.js
	@node src/database/seed-all.js
	@echo "$(GREEN)✅ Non-interactive database setup completed$(NC)"

start: ## Start the API server in production mode
	@echo "$(GREEN)Starting Resculance API...$(NC)"
	@npm start

dev: ## Start the API server in development mode with nodemon
	@echo "$(GREEN)Starting Resculance API in development mode...$(NC)"
	@npm run dev

dev-frontend: ## Start the frontend development server
	@echo "$(GREEN)Starting frontend development server...$(NC)"
	@cd frontend && npm run dev

dev-all: ## Start both backend and frontend in development mode
	@echo "$(GREEN)Starting full development environment...$(NC)"
	@make -j 2 dev dev-frontend

stop: ## Stop all node processes
	@echo "$(YELLOW)Stopping all node processes...$(NC)"
	@pkill -f "node src/server.js" || true
	@pkill -f "nodemon" || true
	@echo "$(GREEN)✅ All processes stopped!$(NC)"

clean: ## Clean node_modules and package-lock files
	@echo "$(YELLOW)Cleaning node_modules...$(NC)"
	@rm -rf node_modules frontend/node_modules
	@rm -f package-lock.json frontend/package-lock.json
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

test: ## Run tests (placeholder)
	@echo "$(YELLOW)No tests configured yet$(NC)"

check-db: ## Check database connection
	@echo "$(BLUE)🔍 Checking database connection...$(NC)"
	@node -e "require('dotenv').config(); const db = require('./src/config/database'); db.query('SELECT 1').then(() => { console.log('\x1b[32m✅ Database connection successful\x1b[0m'); process.exit(0); }).catch(err => { console.error('\x1b[31m❌ Database connection failed:\x1b[0m', err.message); process.exit(1); });"

status: ## Show system status
	@echo "$(BLUE)╔════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          System Status Check               ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════╝$(NC)"
	@echo ""
	@node -e "require('dotenv').config(); console.log('$(GREEN)Node version:$(NC)', process.version); console.log('$(GREEN)Environment:$(NC)', process.env.NODE_ENV || 'development'); console.log('$(GREEN)Port:$(NC)', process.env.PORT || 3000);"
	@echo ""
	@make check-db

quick-start: install db-setup ## Quick start for new setup (install + db-setup)
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║     🎉 Quick Start Completed! 🎉          ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Run 'make dev' to start development server"
	@echo "  2. Run 'make dev-frontend' to start frontend"
	@echo "  3. Or run 'make dev-all' to start both"
	@echo ""

.DEFAULT_GOAL := help
