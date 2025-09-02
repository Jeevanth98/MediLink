// Mock Firebase services for development/testing

export interface MockUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  sendEmailVerification: () => Promise<void>;
}

export interface MockConfirmationResult {
  confirm: (verificationCode: string) => Promise<MockUser>;
}

// Mock Firebase Auth
class MockFirebaseAuth {
  private currentUser: MockUser | null = null;
  private listeners: Array<(user: MockUser | null) => void> = [];

  onAuthStateChanged(callback: (user: MockUser | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async createUserWithEmailAndPassword(email: string, _password: string): Promise<{ user: MockUser }> {
    const user: MockUser = {
      uid: `demo-user-${Date.now()}`,
      email,
      phoneNumber: null,
      sendEmailVerification: async () => {
        console.log('Mock: Email verification sent to', email);
      }
    };
    
    this.currentUser = user;
    this.notifyListeners();
    
    return { user };
  }

  async signInWithEmailAndPassword(email: string, _password: string): Promise<{ user: MockUser }> {
    const user: MockUser = {
      uid: `demo-user-signin-${Date.now()}`,
      email,
      phoneNumber: null,
      sendEmailVerification: async () => {
        console.log('Mock: Email verification sent to', email);
      }
    };
    
    this.currentUser = user;
    this.notifyListeners();
    
    return { user };
  }

  async signInWithPhoneNumber(phoneNumber: string): Promise<MockConfirmationResult> {
    return {
      confirm: async (_verificationCode: string) => {
        const user: MockUser = {
          uid: `demo-user-phone-${Date.now()}`,
          email: null,
          phoneNumber,
          sendEmailVerification: async () => {
            console.log('Mock: Email verification not available for phone users');
          }
        };
        
        this.currentUser = user;
        this.notifyListeners();
        
        return user;
      }
    };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners();
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    console.log('Mock: Password reset email sent to', email);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

// Mock Firestore
class MockFirestore {
  collection(path: string) {
    return {
      doc: (id: string) => ({
        get: async () => ({
          exists: () => true,
          data: () => ({
            role: 'patient',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        set: async (data: any) => {
          console.log('Mock Firestore set:', path, id, data);
        },
        update: async (data: any) => {
          console.log('Mock Firestore update:', path, id, data);
        },
      }),
      add: async (data: any) => {
        console.log('Mock Firestore add:', path, data);
        return { id: `demo-doc-${Date.now()}` };
      },
      where: () => ({
        get: async () => ({
          docs: [],
          forEach: () => {},
        }),
      }),
    };
  }

  FieldValue = {
    serverTimestamp: () => new Date(),
  };
}

export const mockAuth = new MockFirebaseAuth();
export const mockFirestore = new MockFirestore();
