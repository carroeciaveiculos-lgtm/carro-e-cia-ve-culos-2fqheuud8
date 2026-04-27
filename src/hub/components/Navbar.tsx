import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
      <h2 className="text-lg font-semibold">MotoresHub Navbar</h2>
      <Link
        to="/logout"
        className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
      >
        Sair
      </Link>
    </nav>
  )
}
