import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    )
}
