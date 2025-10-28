import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/base.css'
import './styles/shared.css'
import './styles/home_page.css'
import './styles/user_profile.css'
import { AuthProvider } from './context/AuthContext'
import LoginModal from './components/LoginModal'
import RegisterModal from './components/RegisterModal'
import { ToastProvider } from './components/ToastProvider'

const root = createRoot(document.getElementById('root'))
root.render(
	<AuthProvider>
		<ToastProvider>
			<App />
			<LoginModal />
			<RegisterModal />
		</ToastProvider>
	</AuthProvider>
)
