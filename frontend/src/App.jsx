import { useState } from 'react'

function App() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4 text-blue-600">SmartCopy Dashboard</h1>
                <p className="text-gray-600">System is running successfully on Docker!</p>
                <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
                    Status: <span className="font-semibold text-green-700">Online</span>
                </div>
            </div>
        </div>
    )
}

export default App
