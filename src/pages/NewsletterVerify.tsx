import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsletterVerify() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setError("Hiányzó megerősítő token.");
            setLoading(false);
            return;
        }

        const verify = async () => {
            try {
                const response = await fetch("/api/newsletter/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Hiba a megerősítés során");
                }

                setSuccess(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Hiba a megerősítés során");
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen grid place-items-center bg-muted/20 p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                {loading ? (
                    <>
                        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                        <p className="text-lg text-muted-foreground">Megerősítés folyamatban...</p>
                    </>
                ) : success ? (
                    <>
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-green-700">Sikeres megerősítés!</h1>
                        <p className="text-muted-foreground">
                            Köszönjük, hogy feliratkoztál a hírlevelünkre. Mostantól értesülni fogsz a legfrissebb híreinkről.
                        </p>
                        <Button onClick={() => navigate("/")} className="w-full">
                            Tovább a főoldalra
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-destructive">Hiba a megerősítés során</h1>
                        <p className="text-muted-foreground">{error}</p>
                        <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                            Vissza a főoldalra
                        </Button>
                    </>
                )}
            </Card>
        </div>
    );
}
