"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  active: boolean | null;
};

export default function TestDatabasePage() {
  const [status, setStatus] = useState(
    "Testing connection..."
  );

  const [profiles, setProfiles] = useState<Profile[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          setStatus(
            `Authentication error: ${userError.message}`
          );
          return;
        }

        if (!user) {
          setStatus(
            "ZARIKS successfully connected to Supabase. No user is currently signed in."
          );
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, role, active"
          )
          .eq("id", user.id);

        if (error) {
          setStatus(
            `Database error: ${error.message}`
          );
          return;
        }

        setProfiles(data ?? []);

        setStatus(
          "ZARIKS successfully connected to Supabase."
        );
      } catch (error) {
        setStatus(
          error instanceof Error
            ? `Connection error: ${error.message}`
            : "Unknown connection error."
        );
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f7f5] px-6 py-16">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* ================= HEADER ================= */}

        <div className="bg-[#064b32] px-8 py-8 text-white">
          <div className="flex items-center gap-4">

            <img
              src="/zariks-logo.png"
              alt="ZARIKS Logo"
              className="h-16 w-16 rounded-2xl object-cover"
            />

            <div>
              <h1 className="text-2xl font-bold">
                ZARIKS
              </h1>

              <p className="mt-1 text-sm text-green-100">
                Transfer Control & Accountability
              </p>
            </div>

          </div>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="p-10">

          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#006b3c]">
            System Diagnostics
          </p>

          <h2 className="text-4xl font-bold text-gray-900">
            Supabase Connection Test
          </h2>

          <p className="mt-2 text-gray-500">
            Verify authentication, database connectivity,
            and the current ZARIKS user profile.
          </p>

          {/* ================= STATUS ================= */}

          <div className="mt-8 rounded-xl border border-green-100 bg-green-50 p-5">
            <p className="text-sm font-semibold text-gray-500">
              Connection Status
            </p>

            <p className="mt-2 font-semibold text-[#006b3c]">
              {loading
                ? "Testing connection..."
                : status}
            </p>
          </div>

          {/* ================= USER ================= */}

          <div className="mt-10">
            <h3 className="text-2xl font-bold">
              Current User Profile
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Profile information returned from the secured
              Supabase database.
            </p>

            {profiles.length === 0 ? (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-gray-600">
                  No authenticated user profile returned.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {profiles.map(
                  (profile) => (
                    <div
                      key={profile.id}
                      className="rounded-xl border border-gray-200 p-6"
                    >
                      <div className="grid gap-6 sm:grid-cols-3">

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                            Name
                          </p>

                          <p className="mt-1 font-semibold">
                            {profile.full_name ??
                              "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                            Role
                          </p>

                          <p className="mt-1 font-semibold capitalize">
                            {profile.role
                              ? profile.role.replaceAll(
                                  "_",
                                  " "
                                )
                              : "Not assigned"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                            Account Status
                          </p>

                          <p
                            className={`mt-1 font-semibold ${
                              profile.active
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {profile.active
                              ? "Active"
                              : "Inactive"}
                          </p>
                        </div>

                      </div>

                      <div className="mt-6 border-t pt-4">
                        <p className="text-xs text-gray-400">
                          User ID: {profile.id}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ================= BACK LINK ================= */}

          <div className="mt-10">
            <a
              href="/"
              className="inline-flex rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white"
            >
              ← Back to ZARIKS Dashboard
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}