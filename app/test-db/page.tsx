"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function TestDatabasePage() {
  const [status, setStatus] = useState("Testing connection...");
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          setStatus(`Authentication error: ${userError.message}`);
          return;
        }

        if (!user) {
          setStatus(
            "Supabase connected successfully. No user is currently logged in."
          );
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, role, active")
          .eq("id", user.id);

        if (error) {
          setStatus(`Database error: ${error.message}`);
          return;
        }

        setProfiles(data ?? []);
        setStatus("ZARIKS successfully connected to Supabase.");
      } catch (error) {
        setStatus(
          error instanceof Error
            ? `Connection error: ${error.message}`
            : "Unknown connection error."
        );
      }
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-300 bg-white p-10 shadow-sm">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-green-700">
          ZARIKS Database Test
        </p>

        <h1 className="mb-8 text-4xl font-bold">
          Supabase Connection
        </h1>

        <div className="mb-10 rounded-xl bg-gray-100 p-5">
          <strong>Status:</strong> {status}
        </div>

        <h2 className="mb-5 text-2xl font-bold">
          Current User Profile
        </h2>

        {profiles.length === 0 ? (
          <p className="text-gray-600">
            No authenticated profile returned.
          </p>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-xl border border-gray-200 p-6"
            >
              <p>
                <strong>Name:</strong> {profile.full_name}
              </p>

              <p>
                <strong>Role:</strong> {profile.role}
              </p>

              <p>
                <strong>Active:</strong>{" "}
                {profile.active ? "Yes" : "No"}
              </p>

              <p className="mt-3 text-sm text-gray-500">
                User ID: {profile.id}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}