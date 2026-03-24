import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Download, Users, FileText, CalendarDays, BookOpen, CheckCircle2, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DOCUMENT_TYPES } from "@/lib/constants";
import * as XLSX from "xlsx";

interface StudentData {
  id: string;
  user_id: string;
  name: string;
  surnames: string;
  cycle: string;
  speciality: string;
  docsCount: number;
  reportsCount: number;
  diaryCount: number;
}

export default function Admin() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (!profiles) { setLoading(false); return; }

      const { data: docs } = await supabase.from("documents").select("user_id, uploaded").eq("uploaded", true);
      const { data: reports } = await supabase.from("weekly_reports").select("user_id, uploaded").eq("uploaded", true);
      const { data: diary } = await supabase.from("diary_entries").select("user_id");

      const mapped = profiles.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        surnames: p.surnames,
        cycle: p.cycle,
        speciality: p.speciality,
        docsCount: docs?.filter((d: any) => d.user_id === p.user_id).length ?? 0,
        reportsCount: reports?.filter((r: any) => r.user_id === p.user_id).length ?? 0,
        diaryCount: diary?.filter((d: any) => d.user_id === p.user_id).length ?? 0,
      }));
      setStudents(mapped);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = students.filter((s) =>
    `${s.name} ${s.surnames} ${s.speciality}`.toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const data = students.map((s) => ({
      Nombre: s.name,
      Apellidos: s.surnames,
      Ciclo: s.cycle === "MEDIO" ? "Grado Medio" : "Grado Superior",
      Especialidad: s.speciality,
      "Docs Entregados": `${s.docsCount}/${DOCUMENT_TYPES.length}`,
      "Reportes Entregados": `${s.reportsCount}/12`,
      "Entradas Memoria": s.diaryCount,
      "Progreso Docs (%)": Math.round((s.docsCount / DOCUMENT_TYPES.length) * 100),
      "Progreso Reportes (%)": Math.round((s.reportsCount / 12) * 100),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumnos Erasmus+");
    XLSX.writeFile(wb, `erasmus_seguimiento_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel exportado correctamente");
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground mt-1">{students.length} alumnos registrados</p>
          </div>
          <Button onClick={exportExcel} className="gap-2 accent-gradient border-0">
            <Download size={18} />
            Exportar Excel
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Alumnos", value: students.length, icon: Users, color: "text-primary bg-primary/10" },
            { label: "Docs Completos", value: students.filter((s) => s.docsCount === DOCUMENT_TYPES.length).length, icon: FileText, color: "text-success bg-success/10" },
            { label: "Reportes Completos", value: students.filter((s) => s.reportsCount === 12).length, icon: CalendarDays, color: "text-secondary bg-secondary/10" },
            { label: "Entradas Memoria", value: students.reduce((sum, s) => sum + s.diaryCount, 0), icon: BookOpen, color: "text-warning bg-warning/10" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <div className={`p-2 rounded-lg w-fit ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar alumno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students table */}
        {loading ? (
          <div className="glass-card p-12 text-center text-muted-foreground">Cargando datos...</div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Alumno</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Especialidad</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Docs</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Reportes</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Memoria</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const totalProgress = Math.round(
                      ((s.docsCount / DOCUMENT_TYPES.length) * 50 + (s.reportsCount / 12) * 50)
                    );
                    return (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <p className="font-medium text-foreground text-sm">{s.name} {s.surnames}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{s.speciality}</p>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">{s.cycle === "MEDIO" ? "GM" : "GS"}</span>
                          {" "}{s.speciality}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-sm font-medium ${s.docsCount === DOCUMENT_TYPES.length ? "text-success" : "text-foreground"}`}>
                            {s.docsCount}/{DOCUMENT_TYPES.length}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-sm font-medium ${s.reportsCount === 12 ? "text-success" : "text-foreground"}`}>
                            {s.reportsCount}/12
                          </span>
                        </td>
                        <td className="p-3 text-center text-sm text-foreground hidden sm:table-cell">{s.diaryCount}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress value={totalProgress} className="h-2 flex-1" />
                            <span className="text-xs font-medium text-muted-foreground w-8">{totalProgress}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
