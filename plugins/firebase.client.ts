import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  // Use variables from runtime config or defaults for dev
  const firebaseConfig = {
    apiKey: "AIzaSyCVlrC-TCDiCxn03fkGc5Qni72LR7gZ1lM",
    authDomain: "booking-a42ec.firebaseapp.com",
    projectId: "booking-a42ec",
    storageBucket: "booking-a42ec.firebasestorage.app",
    messagingSenderId: "1021739949560",
    appId: "1:1021739949560:web:09e525a2052c3547200a0d",
    measurementId: "G-5FE45QKZT8"
  };

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  return {
    provide: {
      auth,
      db
    }
  }
})
