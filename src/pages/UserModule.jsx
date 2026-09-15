import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users } from 'lucide-react';

export default function UserModule() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-brand-500" />
          Registered Users
        </h1>
        <p className="text-gray-400 mt-1">Manage platform users</p>
      </div>

      <div className="bg-[#2a2a2a] rounded-2xl shadow-sm border border-[#3a3a3a] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1f1f1f]">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300 border-b border-[#3a3a3a]">Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300 border-b border-[#3a3a3a]">Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300 border-b border-[#3a3a3a]">Joined</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-300 border-b border-[#3a3a3a]">UID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a3a]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[#3a3a3a] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 font-mono">{user.uid}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
