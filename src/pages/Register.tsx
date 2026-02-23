import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo_calasanz.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { CICLOS_MEDIO, CICLOS_SUPERIOR } from "@/lib/constants";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    surnames: "",
    cycle: "" as "" | "MEDIO" | "SUPERIOR",
    speciality: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const specialities = form.cycle === "MEDIO" ? CICLOS_MEDIO : form.cycle === "SUPERIOR" ? CICLOS_SUPERIOR : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cycle || !form.speciality) {
      toast.error("Selecciona tu ciclo y especialidad.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Profile will be created after email confirmation via CompleteProfile page
      // Store profile data in localStorage so CompleteProfile can use it
      localStorage.setItem("pending_profile", JSON.stringify({
        name: form.name,
        surnames: form.surnames,
        cycle: form.cycle,
        speciality: form.speciality,
      }));
      toast.success("¡Registro completado! Revisa tu correo para verificar la cuenta.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <img src={logo} alt="Calasanz" className="h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Registro Erasmus+</h1>
          <p className="text-muted-foreground mt-1">Crea tu cuenta para comenzar el seguimiento</p>
        </div>

        <div className="glass-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" className="mt-1.5" />
              </div>
              <div>
                <Label>Apellidos</Label>
                <Input required value={form.surnames} onChange={(e) => setForm({ ...form, surnames: e.target.value })} placeholder="Tus apellidos" className="mt-1.5" />
              </div>
            </div>

            <div>
              <Label>Correo electrónico</Label>
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" className="mt-1.5" />
            </div>

            <div>
              <Label>Contraseña</Label>
              <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" className="mt-1.5" />
            </div>

            <div>
              <Label>Ciclo Formativo</Label>
              <Select value={form.cycle} onValueChange={(v) => setForm({ ...form, cycle: v as "MEDIO" | "SUPERIOR", speciality: "" })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecciona tu ciclo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEDIO">Grado Medio</SelectItem>
                  <SelectItem value="SUPERIOR">Grado Superior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.cycle && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <Label>Especialidad</Label>
                <Select value={form.speciality} onValueChange={(v) => setForm({ ...form, speciality: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecciona tu especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialities.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            <Button type="submit" disabled={loading} className="w-full gap-2 mt-2">
              <UserPlus size={18} />
              {loading ? "Registrando..." : "Crear Cuenta"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-secondary font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
