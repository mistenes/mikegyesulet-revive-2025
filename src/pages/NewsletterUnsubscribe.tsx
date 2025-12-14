import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function NewsletterUnsubscribe() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setError("Hiányzó leiratkozási token.");
            setLoading(false);
            return;
        }

        // Auto-unsubscribe or wait for confirmation?
        // GDPR best practice: Easier is better, but accidental clicks happen.
        // Usually, clicking the link in email is a GET request, so it should ideally show a "Confirm Unsubscribe" page
        // instead of immediately unsubscribing, to prevent email scanners from unsubscribing users effectively.
        // So we will NOT auto-unsubscribe on mount. We will ask for confirmation.
        setLoading(false);
    }, [token]);

    const handleUnsubscribe = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/newsletter/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                // If already unsubscribed (200 OK with message), the backend logic was:
                // 200: "Már leiratkoztál" or "Sikeresen..."
                // 404: Invalid
                // Wait, my backend implementation returns 200 for "Már leiratkoztál" which is good.
                // But if response.ok is false, it's an error.
                throw new Error(data.message || "Hiba a leiratkozás során");
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Hiba a leiratkozás során");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="flex justify-center">
                    {success ? (
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    ) : error ? (
                        <XCircle className="h-16 w-16 text-red-500" />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-3xl">👋</span>
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900">
                    {success ? "Sikeres leiratkozás" : error ? "Hiba történt" : "Leiratkozás megerősítése"}
                </h1>

                <p className="text-gray-600">
                    {success
                        ? "Sajnáljuk, hogy mész! Az email címedet eltávolítottuk a hírlevél listáról."
                        : error
                            ? error
                            : "Biztosan le szeretnél iratkozni a Magyar Ifjúsági Konferencia hírleveléről?"}
                </p>

                {!success && !error && (
                    <div className="flex flex-col gap-3">
                        <Button onClick={handleUnsubscribe} disabled={loading} size="lg" variant="destructive" className="w-full">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Igen, leiratkozom"}
                        </Button>
                        <Link to="/">
                            <Button variant="outline" className="w-full">Mégse, maradok</Button>
                        </Link>
                    </div>
                )}

                {success && (
                    <Link to="/">
                        <Button className="w-full">Vissza a főoldalra</Button>
                    </Link>
                )}
            </Card>
        </div>
    );
}
