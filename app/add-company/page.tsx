"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CompanyWizard from "@/components/company-form/CompanyWizard";

export default function AddCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie...
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#05070a]">
      <CompanyWizard />
    </main>
  );
}