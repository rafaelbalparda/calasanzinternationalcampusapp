import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { FileText, CalendarDays, BookOpen, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ docs: 0, reports: 0, diary: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [docsRes, reportsRes, diaryRes] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact" }).eq("user_id", user.id).eq("uploaded", true),
        supabase.from("weekly_reports").select("id", { count: "exact" }).eq("user_id", user.id).eq("uploaded", true),
        supabase.from("diary_entries").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);
      setStats({
        docs: docsRes.count ?? 0,
        reports: reportsRes.count ?? 0,
        diary: diaryRes.count ?? 0,
      });
    };
    fetchStats();
  }, [user]);

  const docProgress = Math.round((stats.docs / DOCUMENT_TYPES.length) * 100);
  const reportProgress = Math.round((stats.reports / 12) * 100);

  const cards = [
    {
      title: "Documentación",
      value: `${stats.docs}/${DOCUMENT_TYPES.length}`,
      progress: docProgress,
      icon: FileText,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Reportes Semanales",
      value: `${stats.reports}/12`,
      progress: reportProgress,
      icon: CalendarDays,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Entradas de Memoria",
      value: String(stats.diary),
      progress: null,
      icon: BookOpen,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            ¡Hola, {profile?.name || "Estudiante"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.speciality && `${profile.speciality} · Grado ${profile.cycle === "MEDIO" ? "Medio" : "Superior"}`}
          </p>
        </div>

        {/* Progress cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <card.icon size={22} className={card.color} />
                </div>
                {card.progress !== null && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    card.progress === 100 ? "status-done" : "status-pending"
                  }`}>
                    {card.progress === 100 ? (
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Completado</span>
                    ) : (
                      <span className="flex items-center gap-1"><Clock size={12} /> {card.progress}%</span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{card.title}</p>
              {card.progress !== null && (
                <Progress value={card.progress} className="mt-3 h-2" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Overall progress */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Progreso General</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Documentación obligatoria</span>
                <span className="font-medium text-foreground">{docProgress}%</span>
              </div>
              <Progress value={docProgress} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Reportes semanales</span>
                <span className="font-medium text-foreground">{reportProgress}%</span>
              </div>
              <Progress value={reportProgress} className="h-3" />
            </div>
          </div>
          {docProgress === 100 && reportProgress === 100 && (
            <div className="mt-4 p-3 rounded-lg status-done border text-center font-medium">
              🎉 ¡Has completado todas las entregas! Tu beca puede considerarse justificada.
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
