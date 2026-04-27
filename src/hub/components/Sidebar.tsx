export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4 h-screen flex flex-col">
      <h3 className="text-xl font-bold mb-6">Sidebar MotoresHub</h3>
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <div className="px-3 py-2 rounded bg-gray-700 cursor-pointer">Início</div>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
