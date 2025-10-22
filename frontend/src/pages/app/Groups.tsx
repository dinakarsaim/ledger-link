import React, { useState, useEffect } from "react";
import api from "../../api";

export default function Groups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
    const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null);

    const sendInvite = async (groupId: string) => {
    if (!inviteEmail) return;
    try {
        await api.post(`/groups/${groupId}/invite`, { email: inviteEmail });
        alert("User invited successfully!");
        setInviteEmail("");
        setInvitingGroupId(null);
    } catch (e: any) {
        alert(e.response?.data?.error || "Invite failed");
    }
    };

  const loadGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data.groups);
    } catch (e: any) {
      setError("Failed to load groups");
    }
  };

  const createGroup = async () => {
    if (!name) return;
    setLoading(true);
    try {
      await api.post("/groups", { name });
      setName("");
      await loadGroups();
    } catch {
      setError("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Groups</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter group name"
          className="flex-1 p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={createGroup}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {groups.length === 0 ? (
        <div className="text-gray-500">No groups yet. Create one!</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {groups.map((g) => (
            <li key={g.id} className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-gray-500 text-sm">
                  Created {new Date(g.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => setInvitingGroupId(g.id)}
                >
                    Invite
                </button>
                </div>
              <button className="text-blue-600 text-sm hover:underline">
                View
              </button>
            </li>
          ))}

          {invitingGroupId && (
            <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Invite user to group</h3>
                <div className="flex gap-3">
                <input
                    type="email"
                    placeholder="User email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 p-2 border rounded"
                />
                <button
                    onClick={() => sendInvite(invitingGroupId)}
                    className="px-4 py-2 bg-primary text-white rounded"
                >
                    Send Invite
                </button>
                <button
                    onClick={() => setInvitingGroupId(null)}
                    className="px-3 py-2 bg-gray-100 rounded"
                >
                    Cancel
                </button>
                </div>
            </div>
            )}
          
        </ul>
      )}

      
    </div>
  );
}