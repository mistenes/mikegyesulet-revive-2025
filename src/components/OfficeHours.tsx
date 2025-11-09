export const OfficeHours = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            ÜGYINTÉZÉS AZ IRODÁINKBAN
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-16" style={{ fontFamily: "'Sora', sans-serif" }}>
            NYITVATARTÁS
          </h2>

          <div className="space-y-12 text-left">
            {/* Központi Iroda */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-foreground">
                Központi Iroda - 2900 Komárom, Arany János utca 17.
              </h3>
              <div className="text-muted-foreground space-y-1">
                <p>Hétfő-Csütörtök: 8:30-16:00</p>
                <p>Péntek-Vasárnap: zárva</p>
              </div>
            </div>

            {/* Kárpátaljai Iroda */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-foreground">
                Kárpátaljai iroda - Beregszász, Mihók Péter út 4.
              </h3>
              <div className="text-muted-foreground space-y-1">
                <p>Hétfő-Kedd: 8:00-14:00</p>
                <p>Szerda - Csütörtök: 12:00-18:00</p>
                <p>Péntek: 8:00-14:00</p>
                <p>Szombat-Vasárnap: zárva</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
