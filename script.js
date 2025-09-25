// Banking Application with Design Patterns Implementation

// ============================================================================
// OBSERVER PATTERN - For Notifications
// ============================================================================

class Observer {
    update(message, type = 'info') {
        throw new Error("Observer must implement update method");
    }
}

class Customer extends Observer {
    constructor(name, email) {
        super();
        this.name = name;
        this.email = email;
    }

    update(message, type = 'info') {
        this.displayNotification(message, type);
    }

    displayNotification(message, type) {
        const notificationContainer = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <strong>${type.toUpperCase()}</strong><br>
            ${message}
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// ============================================================================
// STRATEGY PATTERN - For Interest Calculation
// ============================================================================

class InterestStrategy {
    calculateInterest(balance, timeInYears = 1) {
        throw new Error("InterestStrategy must implement calculateInterest method");
    }
    
    getRate() {
        throw new Error("InterestStrategy must implement getRate method");
    }
}

class SavingsInterestStrategy extends InterestStrategy {
    calculateInterest(balance, timeInYears = 1) {
        return balance * 0.025 * timeInYears; // 2.5% APY
    }
    
    getRate() {
        return 2.5;
    }
}

class CheckingInterestStrategy extends InterestStrategy {
    calculateInterest(balance, timeInYears = 1) {
        return 0; // No interest for checking accounts
    }
    
    getRate() {
        return 0;
    }
}

class FixedDepositInterestStrategy extends InterestStrategy {
    calculateInterest(balance, timeInYears = 1) {
        return balance * 0.045 * timeInYears; // 4.5% APY
    }
    
    getRate() {
        return 4.5;
    }
}

// ============================================================================
// ACCOUNT CLASSES
// ============================================================================

class Account {
    constructor(accountNumber, accountType, initialBalance = 0) {
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.balance = initialBalance;
        this.observers = [];
        this.transactionHistory = [];
        this.createdAt = new Date();
        
        // Set interest strategy based on account type
        this.setInterestStrategy(accountType);
    }

    setInterestStrategy(accountType) {
        switch(accountType) {
            case 'savings':
                this.interestStrategy = new SavingsInterestStrategy();
                break;
            case 'checking':
                this.interestStrategy = new CheckingInterestStrategy();
                break;
            case 'fixed':
                this.interestStrategy = new FixedDepositInterestStrategy();
                break;
            default:
                this.interestStrategy = new CheckingInterestStrategy();
        }
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers(message, type = 'info') {
        this.observers.forEach(observer => {
            observer.update(message, type);
        });
    }

    deposit(amount, description = '') {
        if (amount <= 0) {
            throw new Error("Deposit amount must be positive");
        }

        const oldBalance = this.balance;
        this.balance += amount;
        
        const transaction = {
            id: Date.now(),
            type: 'deposit',
            amount: amount,
            balance: this.balance,
            description: description,
            timestamp: new Date(),
            accountNumber: this.accountNumber
        };
        
        this.transactionHistory.push(transaction);
        
        this.notifyObservers(
            `Deposit of $${amount.toFixed(2)} successful. New balance: $${this.balance.toFixed(2)}`,
            'success'
        );
        
        return transaction;
    }

    withdraw(amount, description = '') {
        if (amount <= 0) {
            throw new Error("Withdrawal amount must be positive");
        }
        
        if (amount > this.balance) {
            throw new Error("Insufficient funds");
        }

        const oldBalance = this.balance;
        this.balance -= amount;
        
        const transaction = {
            id: Date.now(),
            type: 'withdraw',
            amount: amount,
            balance: this.balance,
            description: description,
            timestamp: new Date(),
            accountNumber: this.accountNumber
        };
        
        this.transactionHistory.push(transaction);
        
        this.notifyObservers(
            `Withdrawal of $${amount.toFixed(2)} successful. New balance: $${this.balance.toFixed(2)}`,
            'success'
        );
        
        return transaction;
    }

    calculateInterest(timeInYears = 1) {
        return this.interestStrategy.calculateInterest(this.balance, timeInYears);
    }

    getInterestRate() {
        return this.interestStrategy.getRate();
    }

    getFormattedBalance() {
        return `$${this.balance.toFixed(2)}`;
    }

    getAccountInfo() {
        return {
            accountNumber: this.accountNumber,
            accountType: this.accountType,
            balance: this.balance,
            interestRate: this.getInterestRate(),
            transactionCount: this.transactionHistory.length
        };
    }
}

// ============================================================================
// COMMAND PATTERN - For Banking Operations
// ============================================================================

class Command {
    execute() {
        throw new Error("Command must implement execute method");
    }

    undo() {
        throw new Error("Command must implement undo method");
    }
}

class DepositCommand extends Command {
    constructor(account, amount, description = '') {
        super();
        this.account = account;
        this.amount = amount;
        this.description = description;
        this.executed = false;
        this.transactionId = null;
    }

    execute() {
        if (!this.executed) {
            const transaction = this.account.deposit(this.amount, this.description);
            this.transactionId = transaction.id;
            this.executed = true;
            return transaction;
        }
    }

    undo() {
        if (this.executed && this.transactionId) {
            // Find and remove the transaction from history
            const transactionIndex = this.account.transactionHistory.findIndex(
                t => t.id === this.transactionId
            );
            
            if (transactionIndex > -1) {
                this.account.balance -= this.amount;
                this.account.transactionHistory.splice(transactionIndex, 1);
                this.executed = false;
                
                this.account.notifyObservers(
                    `Deposit of $${this.amount.toFixed(2)} has been undone. Balance: $${this.account.balance.toFixed(2)}`,
                    'warning'
                );
            }
        }
    }
}

class WithdrawCommand extends Command {
    constructor(account, amount, description = '') {
        super();
        this.account = account;
        this.amount = amount;
        this.description = description;
        this.executed = false;
        this.transactionId = null;
    }

    execute() {
        if (!this.executed) {
            const transaction = this.account.withdraw(this.amount, this.description);
            this.transactionId = transaction.id;
            this.executed = true;
            return transaction;
        }
    }

    undo() {
        if (this.executed && this.transactionId) {
            const transactionIndex = this.account.transactionHistory.findIndex(
                t => t.id === this.transactionId
            );
            
            if (transactionIndex > -1) {
                this.account.balance += this.amount;
                this.account.transactionHistory.splice(transactionIndex, 1);
                this.executed = false;
                
                this.account.notifyObservers(
                    `Withdrawal of $${this.amount.toFixed(2)} has been undone. Balance: $${this.account.balance.toFixed(2)}`,
                    'warning'
                );
            }
        }
    }
}

class TransferCommand extends Command {
    constructor(fromAccount, toAccount, amount, description = '') {
        super();
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.amount = amount;
        this.description = description;
        this.executed = false;
        this.fromTransactionId = null;
        this.toTransactionId = null;
    }

    execute() {
        if (!this.executed) {
            // First withdraw from source account
            const withdrawTransaction = this.fromAccount.withdraw(
                this.amount, 
                `Transfer to ${this.toAccount.accountNumber}: ${this.description}`
            );
            
            // Then deposit to destination account
            const depositTransaction = this.toAccount.deposit(
                this.amount, 
                `Transfer from ${this.fromAccount.accountNumber}: ${this.description}`
            );
            
            this.fromTransactionId = withdrawTransaction.id;
            this.toTransactionId = depositTransaction.id;
            this.executed = true;
            
            return {
                from: withdrawTransaction,
                to: depositTransaction
            };
        }
    }

    undo() {
        if (this.executed && this.fromTransactionId && this.toTransactionId) {
            // Remove transactions from both accounts
            const fromIndex = this.fromAccount.transactionHistory.findIndex(
                t => t.id === this.fromTransactionId
            );
            const toIndex = this.toAccount.transactionHistory.findIndex(
                t => t.id === this.toTransactionId
            );
            
            if (fromIndex > -1 && toIndex > -1) {
                // Reverse the transfer
                this.fromAccount.balance += this.amount;
                this.toAccount.balance -= this.amount;
                
                // Remove transactions from history
                this.fromAccount.transactionHistory.splice(fromIndex, 1);
                this.toAccount.transactionHistory.splice(toIndex, 1);
                
                this.executed = false;
                
                this.fromAccount.notifyObservers(
                    `Transfer of $${this.amount.toFixed(2)} to ${this.toAccount.accountNumber} has been undone`,
                    'warning'
                );
            }
        }
    }
}

// ============================================================================
// TRANSACTION MANAGER - Handles Commands
// ============================================================================

class TransactionManager {
    constructor() {
        this.commandHistory = [];
        this.currentPosition = -1;
    }

    executeCommand(command) {
        try {
            const result = command.execute();
            
            // Clear any commands after current position (for redo functionality)
            this.commandHistory = this.commandHistory.slice(0, this.currentPosition + 1);
            
            // Add new command to history
            this.commandHistory.push(command);
            this.currentPosition++;
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    undoLastCommand() {
        if (this.currentPosition >= 0) {
            const command = this.commandHistory[this.currentPosition];
            command.undo();
            this.currentPosition--;
            return true;
        }
        return false;
    }

    canUndo() {
        return this.currentPosition >= 0;
    }

    getCommandHistory() {
        return this.commandHistory.slice(0, this.currentPosition + 1);
    }
}

// ============================================================================
// BANKING SYSTEM - Main Application Class
// ============================================================================

class BankingSystem {
    constructor() {
        this.accounts = new Map();
        this.customers = new Map();
        this.transactionManager = new TransactionManager();
        this.accountCounter = 1000;
        
        // Create default customer
        this.createCustomer('John Doe', 'john@example.com');
        
        // Initialize UI
        this.initializeUI();
        this.setupEventListeners();
        
        // Create some demo accounts
        this.createDemoAccounts();
    }

    createCustomer(name, email) {
        const customer = new Customer(name, email);
        this.customers.set(email, customer);
        return customer;
    }

    createAccount(accountType, initialBalance = 0, customerEmail = 'john@example.com') {
        const accountNumber = `ACC${this.accountCounter++}`;
        const account = new Account(accountNumber, accountType, initialBalance);
        
        // Add customer as observer
        const customer = this.customers.get(customerEmail);
        if (customer) {
            account.addObserver(customer);
        }
        
        this.accounts.set(accountNumber, account);
        
        // Update UI
        this.updateAccountDropdowns();
        this.updateAccountsList();
        this.updateBalanceDisplay();
        
        return account;
    }

    getAccount(accountNumber) {
        return this.accounts.get(accountNumber);
    }

    deposit(accountNumber, amount, description = '') {
        const account = this.getAccount(accountNumber);
        if (!account) {
            throw new Error("Account not found");
        }

        const command = new DepositCommand(account, amount, description);
        const result = this.transactionManager.executeCommand(command);
        
        this.updateUI();
        return result;
    }

    withdraw(accountNumber, amount, description = '') {
        const account = this.getAccount(accountNumber);
        if (!account) {
            throw new Error("Account not found");
        }

        const command = new WithdrawCommand(account, amount, description);
        const result = this.transactionManager.executeCommand(command);
        
        this.updateUI();
        return result;
    }

    transfer(fromAccountNumber, toAccountNumber, amount, description = '') {
        const fromAccount = this.getAccount(fromAccountNumber);
        const toAccount = this.getAccount(toAccountNumber);
        
        if (!fromAccount || !toAccount) {
            throw new Error("One or both accounts not found");
        }
        
        if (fromAccountNumber === toAccountNumber) {
            throw new Error("Cannot transfer to the same account");
        }

        const command = new TransferCommand(fromAccount, toAccount, amount, description);
        const result = this.transactionManager.executeCommand(command);
        
        this.updateUI();
        return result;
    }

    undoLastTransaction() {
        if (this.transactionManager.undoLastCommand()) {
            this.updateUI();
            return true;
        }
        return false;
    }

    getAllTransactions() {
        const allTransactions = [];
        
        this.accounts.forEach(account => {
            allTransactions.push(...account.transactionHistory);
        });
        
        // Sort by timestamp (newest first)
        return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
    }

    createDemoAccounts() {
        // Create demo accounts with initial balances
        this.createAccount('savings', 5000);
        this.createAccount('checking', 2500);
        this.createAccount('fixed', 10000);
    }

    updateUI() {
        this.updateBalanceDisplay();
        this.updateTransactionHistory();
        this.updateAccountsList();
    }

    updateBalanceDisplay() {
        let savingsBalance = 0;
        let checkingBalance = 0;
        let fixedBalance = 0;

        this.accounts.forEach(account => {
            switch(account.accountType) {
                case 'savings':
                    savingsBalance += account.balance;
                    break;
                case 'checking':
                    checkingBalance += account.balance;
                    break;
                case 'fixed':
                    fixedBalance += account.balance;
                    break;
            }
        });

        document.getElementById('savings-balance').textContent = `$${savingsBalance.toFixed(2)}`;
        document.getElementById('checking-balance').textContent = `$${checkingBalance.toFixed(2)}`;
        document.getElementById('fixed-balance').textContent = `$${fixedBalance.toFixed(2)}`;
    }

    updateTransactionHistory() {
        const transactions = this.getAllTransactions().slice(0, 10); // Last 10 transactions
        const container = document.getElementById('transaction-history');
        
        if (transactions.length === 0) {
            container.innerHTML = '<p class="no-transactions">No transactions yet</p>';
            return;
        }

        container.innerHTML = transactions.map(transaction => {
            const isPositive = transaction.type === 'deposit';
            const icon = transaction.type === 'deposit' ? 'fa-plus' : 
                        transaction.type === 'withdraw' ? 'fa-minus' : 'fa-exchange-alt';
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon ${transaction.type}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${transaction.description || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</h4>
                            <small>${transaction.timestamp.toLocaleString()}</small>
                        </div>
                    </div>
                    <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : '-'}$${transaction.amount.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');

        // Update full transaction history
        const fullContainer = document.getElementById('full-transaction-history');
        if (fullContainer) {
            fullContainer.innerHTML = this.getAllTransactions().map(transaction => {
                const isPositive = transaction.type === 'deposit';
                const icon = transaction.type === 'deposit' ? 'fa-plus' : 
                            transaction.type === 'withdraw' ? 'fa-minus' : 'fa-exchange-alt';
                
                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-icon ${transaction.type}">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="transaction-details">
                                <h4>${transaction.description || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</h4>
                                <small>Account: ${transaction.accountNumber} | ${transaction.timestamp.toLocaleString()}</small>
                            </div>
                        </div>
                        <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : '-'}$${transaction.amount.toFixed(2)}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    updateAccountDropdowns() {
        const dropdowns = [
            'depositAccount', 'withdrawAccount', 
            'transferFrom', 'transferTo', 'filterAccount'
        ];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                const currentValue = dropdown.value;
                dropdown.innerHTML = '';
                
                if (dropdownId === 'filterAccount') {
                    dropdown.innerHTML = '<option value="all">All Accounts</option>';
                }
                
                this.accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.accountNumber;
                    option.textContent = `${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} (${account.accountNumber}) - ${account.getFormattedBalance()}`;
                    dropdown.appendChild(option);
                });
                
                // Restore previous selection if it still exists
                if (currentValue && [...dropdown.options].some(opt => opt.value === currentValue)) {
                    dropdown.value = currentValue;
                }
            }
        });
    }

    updateAccountsList() {
        const container = document.getElementById('accounts-list');
        if (!container) return;

        if (this.accounts.size === 0) {
            container.innerHTML = '<p class="no-accounts">No accounts created yet</p>';
            return;
        }

        container.innerHTML = Array.from(this.accounts.values()).map(account => {
            const interestRate = account.getInterestRate();
            return `
                <div class="account-item">
                    <div class="account-info">
                        <h4>${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account</h4>
                        <small>Account: ${account.accountNumber}</small>
                        ${interestRate > 0 ? `<small>Interest Rate: ${interestRate}% APY</small>` : ''}
                    </div>
                    <div class="account-balance">
                        ${account.getFormattedBalance()}
                    </div>
                </div>
            `;
        }).join('');
    }

    initializeUI() {
        this.updateBalanceDisplay();
        this.updateAccountDropdowns();
        this.updateAccountsList();
        this.updateTransactionHistory();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Modal event listeners will be set up in the global functions
    }

    switchTab(tabName) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }
}

// ============================================================================
// GLOBAL FUNCTIONS FOR UI INTERACTION
// ============================================================================

let bankingSystem;

// Initialize the banking system when page loads
document.addEventListener('DOMContentLoaded', function() {
    bankingSystem = new BankingSystem();
});

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Account creation
function createAccount() {
    const accountType = document.getElementById('accountType').value;
    const initialDeposit = parseFloat(document.getElementById('initialDeposit').value) || 0;
    
    try {
        const account = bankingSystem.createAccount(accountType, initialDeposit);
        
        // Clear form
        document.getElementById('initialDeposit').value = '';
        
        // Show success notification
        const customer = Array.from(bankingSystem.customers.values())[0];
        customer.update(`${accountType.charAt(0).toUpperCase() + accountType.slice(1)} account created successfully with initial deposit of $${initialDeposit.toFixed(2)}`, 'success');
        
    } catch (error) {
        const customer = Array.from(bankingSystem.customers.values())[0];
        customer.update(`Error creating account: ${error.message}`, 'error');
    }
}

// Transaction handlers
function handleDeposit(event) {
    event.preventDefault();
    
    const accountNumber = document.getElementById('depositAccount').value;
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const description = document.getElementById('depositDescription').value;
    
    try {
        bankingSystem.deposit(accountNumber, amount, description);
        
        // Clear form and close modal
        document.getElementById('depositAmount').value = '';
        document.getElementById('depositDescription').value = '';
        closeModal('depositModal');
        
    } catch (error) {
        const customer = Array.from(bankingSystem.customers.values())[0];
        customer.update(`Deposit failed: ${error.message}`, 'error');
    }
    
    return false;
}

function handleWithdraw(event) {
    event.preventDefault();
    
    const accountNumber = document.getElementById('withdrawAccount').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const description = document.getElementById('withdrawDescription').value;
    
    try {
        bankingSystem.withdraw(accountNumber, amount, description);
        
        // Clear form and close modal
        document.getElementById('withdrawAmount').value = '';
        document.getElementById('withdrawDescription').value = '';
        closeModal('withdrawModal');
        
    } catch (error) {
        const customer = Array.from(bankingSystem.customers.values())[0];
        customer.update(`Withdrawal failed: ${error.message}`, 'error');
    }
    
    return false;
}

function handleTransfer(event) {
    event.preventDefault();
    
    const fromAccount = document.getElementById('transferFrom').value;
    const toAccount = document.getElementById('transferTo').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const description = document.getElementById('transferDescription').value;
    
    try {
        bankingSystem.transfer(fromAccount, toAccount, amount, description);
        
        // Clear form and close modal
        document.getElementById('transferAmount').value = '';
        document.getElementById('transferDescription').value = '';
        closeModal('transferModal');
        
    } catch (error) {
        const customer = Array.from(bankingSystem.customers.values())[0];
        customer.update(`Transfer failed: ${error.message}`, 'error');
    }
    
    return false;
}

function undoLastTransaction() {
    if (bankingSystem.undoLastTransaction()) {
        const customer = Array.from(bankingSystem.customers.values())[0];
        customer.update('Last transaction has been undone successfully', 'warning');
    } else {
        const customer = Array.from(bankingSystem.customers.values())[0];
        customer.update('No transactions to undo', 'error');
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});