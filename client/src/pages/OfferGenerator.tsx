import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { type User } from '@/lib/types';
import './OfferGenerator.css';

const banks = ["Alior Leasing", "Vehis", "Millennium Leasing", "PKO Leasing", "EFL", "Polski Leasing", "Impuls Leasing", "Pekao Leasing"];

export default function OfferGenerator() {
  const [, setLocation] = useLocation();

  // Get users to populate advisors dynamically, or fallback to the hardcoded ones
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filter advisors to explicitly include only the target three (Arkadiusz, Piotr, Łukasz)
  const advisors = users.filter(u => {
    const name = u.name.toLowerCase();
    return name.includes('arkadiusz') || name.includes('piotr') || name.includes('łukasz') || name.includes('lukasz');
  });

  // React states for form fields
  const [advisorId, setAdvisorId] = useState('');
  const [model, setModel] = useState('Toyota Corolla 1.8 Hybrid');
  const [year, setYear] = useState(new Date().getFullYear());
  const [priceNetto, setPriceNetto] = useState(84146);
  const [ownContribution, setOwnContribution] = useState(8415);
  const [redemption, setRedemption] = useState(21037);
  const [months, setMonths] = useState(60);
  
  const [bestBank, setBestBank] = useState('Alior Leasing');
  const [bestRate, setBestRate] = useState(1255);
  
  const [comp1Bank, setComp1Bank] = useState('PKO Leasing');
  const [comp2Bank, setComp2Bank] = useState('EFL');

  const [isGenerating, setIsGenerating] = useState(false);

  // Computed values
  const priceBrutto = priceNetto * 1.23;
  const ownContributionBrutto = ownContribution * 1.23;
  const redemptionBrutto = redemption * 1.23;
  
  const bestRateBrutto = bestRate * 1.23;
  
  const comp1Rate = bestRate * 1.015;
  const comp1RateBrutto = comp1Rate * 1.23;

  const comp2Rate = bestRate * 1.03;
  const comp2RateBrutto = comp2Rate * 1.23;

  // Initial advisor selection if users data loads
  useEffect(() => {
    if (advisors.length > 0 && !advisorId) {
      setAdvisorId(advisors[0].id);
    }
  }, [advisors, advisorId]);

  const selectedAdvisor = advisors.find(a => a.id === advisorId);
  
  // Proxy dla awatarów, żeby uniknąć błędu CORS podczas generowania PDF
  const proxyUrl = (url: string) => `/api/proxy-image?url=${encodeURIComponent(url)}`;

  // Dane doradców - URL bezpośrednie (bez proxy) do wyświetlania na ekranie
  let advPhotoDisplay = 'https://szybkieauto.com/wp-content/uploads/2026/02/Projekt-bez-nazwy.png';
  let advPhotoPdf = proxyUrl('https://szybkieauto.com/wp-content/uploads/2026/02/Projekt-bez-nazwy.png');
  let advPhone = '000 000 000';
  let advEmail = selectedAdvisor?.email || 'email@szybkieauto.pl';
  let advName = selectedAdvisor?.name || 'Imię Nazwisko';

  if (advName.includes('Piotr')) {
    advPhotoDisplay = 'https://szybkieauto.com/wp-content/uploads/2025/12/1.png';
    advPhotoPdf = proxyUrl('https://szybkieauto.com/wp-content/uploads/2025/12/1.png');
    advPhone = '665 382 810';
    advEmail = 'Piotr.kazibudzki@szybkieauto.pl';
  } else if (advName.includes('Łukasz')) {
    advPhotoDisplay = 'https://szybkieauto.com/wp-content/uploads/2025/12/3.png';
    advPhotoPdf = proxyUrl('https://szybkieauto.com/wp-content/uploads/2025/12/3.png');
    advPhone = '506 698 425';
    advEmail = 'lukasz.gogolewski@szybkieauto.pl';
  } else if (advName.includes('Arkadiusz')) {
    advPhotoDisplay = 'https://szybkieauto.com/wp-content/uploads/2026/02/Projekt-bez-nazwy.png';
    advPhotoPdf = proxyUrl('https://szybkieauto.com/wp-content/uploads/2026/02/Projekt-bez-nazwy.png');
    advPhone = '663 885 270';
    advEmail = 'arkadiusz.mroz@szybkieauto.pl';
  }

  const fmt = (n: number) => new Intl.NumberFormat('pl-PL').format(Math.round(n));
  const currentDate = new Date().toLocaleDateString('pl-PL');

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const html2pdf = (window as any).html2pdf;
      if (!html2pdf) throw new Error('html2pdf not loaded');

      const element = document.getElementById('pdf-content');
      const opt = {
        margin: 0,
        filename: `Oferta_${model.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF error:', error);
      alert('Błąd generowania PDF: ' + (error as any)?.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="sa-app">
      <div className="sa-editor">
        <div className="sa-h3">Kreator Oferty</div>

        <div className="sa-grp">
          <span className="sa-lbl">1. Wybierz Handlowca</span>
          <select className="sa-sel" value={advisorId} onChange={(e) => setAdvisorId(e.target.value)}>
            {advisors.map(adv => (
              <option key={adv.id} value={adv.id}>{adv.name}</option>
            ))}
          </select>
        </div>

        <div className="sa-grp">
          <span className="sa-lbl">2. Samochód</span>
          <input type="text" className="sa-inp" value={model} onChange={(e) => setModel(e.target.value)} />
          <span className="sa-lbl" style={{marginTop: 5}}>Rok Produkcji</span>
          <input type="number" className="sa-inp" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <span className="sa-lbl" style={{marginTop: 5}}>Cena Netto</span>
          <input type="number" className="sa-inp" value={priceNetto} onChange={(e) => setPriceNetto(Number(e.target.value))} />
        </div>

        <div className="sa-grp">
          <span className="sa-lbl">3. Parametry Leasingu</span>
          <input type="number" className="sa-inp" value={ownContribution} onChange={(e) => setOwnContribution(Number(e.target.value))} placeholder="Wpłata (zł)" />
          <input type="number" className="sa-inp" value={redemption} onChange={(e) => setRedemption(Number(e.target.value))} placeholder="Wykup (zł)" style={{marginTop: 5}}/>
          <input type="number" className="sa-inp" value={months} onChange={(e) => setMonths(Number(e.target.value))} placeholder="Okres (mc)" style={{marginTop: 5}}/>
        </div>

        <div style={{background: '#eff6ff', padding: 15, borderRadius: 8, marginBottom: 15, border: '1px solid #dbeafe'}}>
          <span className="sa-lbl" style={{color: '#2563eb'}}>NAJLEPSZA OFERTA (ŚRODEK)</span>
          <select className="sa-sel" value={bestBank} onChange={(e) => setBestBank(e.target.value)} style={{borderColor: '#2563eb', fontWeight: 600}}>
            {banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="number" className="sa-inp" value={bestRate} onChange={(e) => setBestRate(Number(e.target.value))} style={{borderColor: '#2563eb', fontWeight: 700, color: '#2563eb', marginTop: 5}} />
        </div>

        <div className="sa-grp">
          <span className="sa-lbl">Konkurencja 1 (Lewa)</span>
          <select className="sa-sel" value={comp1Bank} onChange={(e) => setComp1Bank(e.target.value)}>
             {banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="sa-grp">
          <span className="sa-lbl">Konkurencja 2 (Prawa)</span>
          <select className="sa-sel" value={comp2Bank} onChange={(e) => setComp2Bank(e.target.value)}>
             {banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>


        <button className="sa-btn" onClick={handleGeneratePDF} disabled={isGenerating}>
          {isGenerating ? "Generowanie..." : "Generuj PDF"}
        </button>
      </div>

      <div className="sa-preview">
        <div id="pdf-content">
          
          {/* STRONA 1 */}
          <div className="pdf-page" id="page-1">
            <div className="doc-head">
              <div className="doc-logo-txt">szybkieauto.pl</div>
              <div className="doc-date">{currentDate}</div>
            </div>

            <div className="doc-hero">
              <div className="dt-label">Twój wybór</div>
              <h1 className="dt-model">{model || '...'}</h1>
              <div className="hero-divider">
                <span className="hero-divider-line"></span>
                <span className="hero-divider-dot"></span>
                <span className="hero-divider-line"></span>
              </div>
              <div className="hero-tagline">Indywidualna Oferta Leasingowa &mdash; szybkieauto.pl</div>
            </div>

            <div className="car-data-strip">
              <div className="cds-item">
                <div className="cds-lbl">Rok Prod.</div>
                <div className="cds-val">{year}</div>
              </div>
              <div className="cds-item">
                <div className="cds-lbl">Cena Netto</div>
                <div className="cds-val"><span>{fmt(priceNetto)}</span> zł</div>
              </div>
              <div className="cds-item">
                <div className="cds-lbl">Cena Brutto</div>
                <div className="cds-val"><span>{fmt(priceBrutto)}</span> zł</div>
              </div>
            </div>

            <div className="offers-area">
              <div className="offers-header">Zestawienie Ofert Rynkowych</div>
              <div className="cards-grid">
                
                {/* Konkurencja 1 */}
                <div className="card standard">
                  <div className="c-head">{comp1Bank}</div>
                  <div className="c-body">
                    <div className="c-price-box">
                      <div className="c-price-lbl">Rata Netto</div>
                      <div className="c-price-val">{fmt(comp1Rate)} zł</div>
                      <div className="c-price-sub">Brutto: <b>{fmt(comp1RateBrutto)} zł</b></div>
                    </div>
                    <div className="c-row"><span>Okres</span><strong>{months} mc</strong></div>
                    <div className="c-row">
                        <span>Wpłata</span>
                        <strong className="text-right">
                          {fmt(ownContribution)} zł
                          <span style={{display:'block', fontSize: 7, color:'#64748b', fontWeight:'normal', lineHeight:1}}>Brutto: {fmt(ownContributionBrutto)} zł</span>
                        </strong>
                    </div>
                    <div className="c-row">
                        <span>Wykup</span>
                        <strong className="text-right">
                          {fmt(redemption)} zł
                          <span style={{display:'block', fontSize: 7, color:'#64748b', fontWeight:'normal', lineHeight:1}}>Brutto: {fmt(redemptionBrutto)} zł</span>
                        </strong>
                    </div>
                  </div>
                </div>

                {/* Oferta Polecana */}
                <div className="card winner">
                  <div className="c-inner">
                    <div className="c-badge">OFERTA POLECANA</div>
                    <div className="c-head">{bestBank}</div>
                    <div className="c-body">
                      <div className="c-price-box">
                        <div className="c-price-lbl">Rata Netto</div>
                        <div className="c-price-val">{fmt(bestRate)} zł</div>
                        <div className="c-price-sub">Brutto: <b>{fmt(bestRateBrutto)} zł</b></div>
                      </div>
                      <div className="c-row"><span>Okres</span><strong>{months} mc</strong></div>
                      <div className="c-row">
                        <span>Wpłata</span>
                        <strong className="text-right">
                          {fmt(ownContribution)} zł
                          <span style={{display:'block', fontSize: 7, color:'#64748b', fontWeight:'normal', lineHeight:1}}>Brutto: {fmt(ownContributionBrutto)} zł</span>
                        </strong>
                      </div>
                      <div className="c-row">
                        <span>Wykup</span>
                        <strong className="text-right">
                          {fmt(redemption)} zł
                          <span style={{display:'block', fontSize: 7, color:'#64748b', fontWeight:'normal', lineHeight:1}}>Brutto: {fmt(redemptionBrutto)} zł</span>
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Konkurencja 2 */}
                <div className="card standard">
                  <div className="c-head">{comp2Bank}</div>
                  <div className="c-body">
                    <div className="c-price-box">
                      <div className="c-price-lbl">Rata Netto</div>
                      <div className="c-price-val">{fmt(comp2Rate)} zł</div>
                      <div className="c-price-sub">Brutto: <b>{fmt(comp2RateBrutto)} zł</b></div>
                    </div>
                    <div className="c-row"><span>Okres</span><strong>{months} mc</strong></div>
                    <div className="c-row">
                        <span>Wpłata</span>
                        <strong className="text-right">
                          {fmt(ownContribution)} zł
                          <span style={{display:'block', fontSize: 7, color:'#64748b', fontWeight:'normal', lineHeight:1}}>Brutto: {fmt(ownContributionBrutto)} zł</span>
                        </strong>
                    </div>
                    <div className="c-row">
                        <span>Wykup</span>
                        <strong className="text-right">
                          {fmt(redemption)} zł
                          <span style={{display:'block', fontSize: 7, color:'#64748b', fontWeight:'normal', lineHeight:1}}>Brutto: {fmt(redemptionBrutto)} zł</span>
                        </strong>
                    </div>
                  </div>
                </div>

              </div>
              <div className="p1-legal">Kalkulacja informacyjna. Wartości brutto zawierają 23% VAT. Decyzja zależy od zdolności kredytowej.</div>
            </div>
          </div>

          {/* STRONA 2 */}
          <div className="pdf-page" id="page-2">
            <div className="page-2-content">
              <div className="doc-head">
                  <div className="doc-logo-txt">szybkieauto.pl</div>
              </div>

              <h2 className="page-title">Dlaczego warto nam zaufać?</h2>
              <div className="page-subtitle">Twój partner w biznesie – bezpieczeństwo, wygoda, oszczędność</div>
              
              <div className="features-grid">
                  <div className="feature">
                      <div className="feat-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                      <div className="feat-txt">
                          <h4>W pełni zdalny proces</h4>
                          <p>Wszystkie formalności załatwisz online, bez konieczności wizyty w oddziale. Oszczędzasz czas i minimalizujesz formalności.</p>
                      </div>
                  </div>
                  <div className="feature">
                      <div className="feat-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                      <div className="feat-txt">
                          <h4>Pełna transparentność kosztów</h4>
                          <p>Otrzymujesz jasny i przejrzysty wykaz opłat oraz prowizji – żadnych ukrytych kosztów. Zawsze wiesz, za co płacisz.</p>
                      </div>
                  </div>
                  <div className="feature">
                      <div className="feat-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </div>
                      <div className="feat-txt">
                          <h4>Wyjątkowe warunki cenowe</h4>
                          <p>Dzięki naszej pozycji na rynku negocjujemy dla Ciebie atrakcyjne rabaty i warunki, niedostępne dla klientów indywidualnych.</p>
                      </div>
                  </div>
                  <div className="feature">
                      <div className="feat-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <div className="feat-txt">
                          <h4>Dedykowany opiekun</h4>
                          <p>Twój osobisty doradca wspiera Cię na każdym etapie – od wyboru samochodu, przez finansowanie i rejestrację, aż po przekazanie kluczyków.</p>
                      </div>
                  </div>
              </div>

              <h3 className="process-title">Jak skorzystać z oferty?</h3>
              <div className="process-timeline">
                  <div className="p-step">
                      <div className="p-dot">1</div>
                      <div className="p-info"><h5>Akceptacja warunków</h5><span>Potwierdź zainteresowanie ofertą mailowo lub telefonicznie u swojego doradcy.</span></div>
                  </div>
                  <div className="p-step">
                      <div className="p-dot">2</div>
                      <div className="p-info"><h5>Szybka decyzja</h5><span>Prześlij nam swoje dane do wniosku – resztą formalności zajmiemy się za Ciebie. Decyzję otrzymasz nawet w 15 minut.</span></div>
                  </div>
                  <div className="p-step">
                      <div className="p-dot">3</div>
                      <div className="p-info"><h5>Odbiór samochodu</h5><span>Zajmiemy się rejestracją pojazdu. Ty odbierasz kluczyki i wyjeżdżasz nowym samochodem!</span></div>
                  </div>
              </div>

              <div className="advisor-card">
                  <img src={advPhotoDisplay} className="adv-photo" crossOrigin="anonymous" alt="Doradca" />
                  <div className="adv-details">
                      <div className="adv-name">{advName}</div>
                      <div className="adv-role">Twój Osobisty Doradca</div>
                      <div className="adv-row">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          <span>{advPhone}</span>
                      </div>
                      <div className="adv-row">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                          <span>{advEmail}</span>
                      </div>
                  </div>
              </div>

              <a href="http://www.szybkieauto.pl" className="web-link">www.szybkieauto.pl</a>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
