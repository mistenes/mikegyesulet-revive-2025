import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { z } from "zod";

const newsletterSchema = z.object({
    name: z.string().min(1, "A név megadása kötelező"),
    email: z.string().email("Érvénytelen email cím"),
});

export const NewsletterSignup = () => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({ name: "", email: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            newsletterSchema.parse(formData);

            const response = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Hiba történt a feliratkozás során");
            }

            setSuccess(true);
            toast({
                title: "Sikeres feliratkozás!",
                description: data.message,
            });
            setFormData({ name: "", email: "" });
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
                });
                setErrors(newErrors);
            } else {
                toast({
                    variant: "destructive",
                    title: "Hiba történt",
                    description: error instanceof Error ? error.message : "Ismeretlen hiba",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-12 bg-background border-t border-border/50">
            <div className="container px-4">
                <div className="max-w-4xl mx-auto">
                    {success ? (
                        <Card className="p-8 text-center bg-green-50/50 border-green-200">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-green-800 mb-2">Sikeres jelentkezés!</h3>
                            <p className="text-green-700">
                                Kérjük, ellenőrizd az email fiókodat a visszaigazoláshoz.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-6 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                                onClick={() => setSuccess(false)}
                            >
                                Új feliratkozás
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8 items-center p-8 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="space-y-4 text-center md:text-left">
                                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-2 md:mb-0">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                                    Iratkozz fel hírlevelünkre!
                                </h3>
                                <p className="text-muted-foreground">
                                    Értesülj első kézből a Magyar Ifjúsági Konferencia legfrissebb híreiről, eseményeiről és programjairól.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Teljes név"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`bg-background ${errors.name ? "border-destructive" : ""}`}
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="Email cím"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`bg-background ${errors.email ? "border-destructive" : ""}`}
                                    />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full font-semibold"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Feliratkozás
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    A feliratkozással elfogadod az adatkezelési tájékoztatónkat.
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
