import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Plus, BookOpen, Trash2, Paperclip, FileIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DiaryEntry {
  id: string;
  entry_date: string;
  title: string;
  content: string;
  created_at: string;
  file_path: string | null;
  file_name: string | null;
}

export default function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", entry_date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });
    setEntries((data as DiaryEntry[]) || []);
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    let filePath: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/memoria/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("student-files").upload(path, file);
      if (uploadError) {
        toast.error("Error subiendo archivo: " + uploadError.message);
        setSaving(false);
        return;
      }
      filePath = path;
      fileName = file.name;
    }

    const { error } = await supabase.from("diary_entries").insert({
      user_id: user.id,
      title: form.title,
      content: form.content,
      entry_date: form.entry_date,
      file_path: filePath,
      file_name: fileName,
    });

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Entrada de memoria guardada");
      try {
        await supabase.functions.invoke("notify-upload", {
          body: { type: "diary", title: form.title, fileName },
        });
      } catch {}
      setForm({ title: "", content: "", entry_date: new Date().toISOString().split("T")[0] });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
      fetchEntries();
    }
    setSaving(false);
  };

  const handleDelete = async (entry: DiaryEntry) => {
    if (entry.file_path) {
      await supabase.storage.from("student-files").remove([entry.file_path]);
    }
    const { error } = await supabase.from("diary_entries").delete().eq("id", entry.id);
    if (!error) {
      toast.success("Entrada eliminada");
      fetchEntries();
    }
  };

  const handleDownload = async (entry: DiaryEntry) => {
    if (!entry.file_path) return;
    const { data } = await supabase.storage.from("student-files").createSignedUrl(entry.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Memoria</h1>
            <p className="text-muted-foreground mt-1">Documenta tu experiencia Erasmus+ con reflexiones y archivos adjuntos</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Nueva Entrada</span>
          </Button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Título</Label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="¿Qué pasó hoy?" className="mt-1.5" />
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Contenido</Label>
                <Textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe tu día, actividades, aprendizajes..." className="mt-1.5 min-h-[150px]" />
              </div>
              <div>
                <Label>Archivo adjunto (opcional)</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <Input
                    ref={fileRef}
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {file && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Paperclip size={14} /> {file.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </motion.div>
        )}

        {entries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aún no tienes entradas en tu memoria</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Comienza a documentar tu experiencia Erasmus+</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                        {new Date(entry.entry_date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{entry.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entry.content}</p>
                    {entry.file_name && (
                      <button
                        onClick={() => handleDownload(entry)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <FileIcon size={14} />
                        {entry.file_name}
                        <Download size={12} />
                      </button>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(entry)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
