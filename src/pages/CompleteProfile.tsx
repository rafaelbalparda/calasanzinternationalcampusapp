import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo_calasanz.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CICLOS_MEDIO, CICLOS_SUPERIOR } from "@/lib/constants";

export default function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  // Try to load pending profile data from registration
  const pendingProfile = (() => {
    try {
      const stored = localStorage.getItem("pending_profile");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })();

  const [form, setForm] = useState({
    name: pendingProfile?.name || "",
    surnames: pendingProfile?.surnames || "",
    cycle: (pendingProfile?.cycle || "") as "" | "MEDIO" | "SUPERIOR",
    speciality: pendingProfile?.speciality || "",
  });
  const [loading, setLoading] = useState(false);

  const specialities = form.cycle === "MEDIO" ? CICLOS_MEDIO : form.cycle === "SUPERIOR" ? CICLOS_SUPERIOR : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.cycle || !form.speciality) {
      toast.error("Completa todos los campos.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: form.name,
      surnames: form.surnames,
      cycle: form.cycle,
      speciality: form.speciality,
    });
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      localStorage.removeItem("pending_profile");
      await refreshProfile();
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={logo} alt="Calasanz" className="h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground">Completa tu perfil</h1>
          <p className="text-muted-foreground text-sm mt-1">Necesitamos unos datos para empezar</p>
        </div>
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nombre</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Apellidos</Label><Input required value={form.surnames} onChange={(e) => setForm({ ...form, surnames: e.target.value })} className="mt-1.5" /></div>
            <div>
              <Label>Ciclo</Label>
              <Select value={form.cycle} onValueChange={(v) => setForm({ ...form, cycle: v as any, speciality: "" })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEDIO">Grado Medio</SelectItem>
                  <SelectItem value="SUPERIOR">Grado Superior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.cycle && (
              <div>
                <Label>Especialidad</Label>
                <Select value={form.speciality} onValueChange={(v) => setForm({ ...form, speciality: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{specialities.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Guardando..." : "Continuar"}</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
