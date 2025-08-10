// Test file for LSP features

interface User {
  id: number
  name: string
  email: string
}

class UserService {
  private users: User[] = []

  constructor() {
    this.users = []
  }

  addUser(user: User): void {
    this.users.push(user)
  }

  getUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id)
  }

  getAllUsers(): User[] {
    return this.users
  }
}

// Create an instance
const userService = new UserService()

// Add a test user
const testUser: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
}

userService.addUser(testUser)

// Get user by ID - example usage
const _foundUser = userService.getUserById(1)
// _foundUser will contain the test user

export { User, UserService }
