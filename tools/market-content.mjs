export const locales = {
  en: { code: 'en', locale: 'en-US', label: 'EN', marketPath: '/market/', hubPath: '/guides/', hubLabel: 'Guides', homeLabel: 'Home', helpLabel: 'Help', privacyLabel: 'Privacy', appLabel: 'Get App', marketLabel: 'Live Market', marketHubTitle: 'Live Precious Metals Prices', marketHubIntro: 'Track real-time prices for gold, silver, platinum, and palladium.', ctaLabel: 'Get the App Free', disclosure: 'MyGoldFolio provides tracking tools, not investment, legal, or tax advice.', consentPrompt: 'Enable functional cookies to view the interactive TradingView chart.', relatedGuide: 'Read our portfolio tracking guide' },
  de: { code: 'de', locale: 'de-DE', label: 'DE', marketPath: '/de/market/', hubPath: '/de/ratgeber/', hubLabel: 'Wissen', homeLabel: 'Startseite', helpLabel: 'Hilfe', privacyLabel: 'Datenschutz', appLabel: 'App holen', marketLabel: 'Live Markt', marketHubTitle: 'Live Edelmetallpreise', marketHubIntro: 'Verfolge Echtzeitpreise für Gold, Silber, Platin und Palladium.', ctaLabel: 'App kostenlos laden', disclosure: 'MyGoldFolio bietet Tracking-Werkzeuge, keine Anlage-, Rechts- oder Steuerberatung.', consentPrompt: 'Aktiviere funktionale Cookies, um den interaktiven TradingView-Chart zu sehen.', relatedGuide: 'Lies unseren Portfolio-Tracking-Guide' },
  fr: { code: 'fr', locale: 'fr-FR', label: 'FR', marketPath: '/fr/market/', hubPath: '/fr/guides/', hubLabel: 'Guides', homeLabel: 'Accueil', helpLabel: 'Aide', privacyLabel: 'Confidentialité', appLabel: 'Obtenir l\'app', marketLabel: 'Marché en direct', marketHubTitle: 'Prix des métaux précieux en direct', marketHubIntro: 'Suivez les prix en temps réel de l\'or, l\'argent, le platine et le palladium.', ctaLabel: 'Télécharger l\'App gratuitement', disclosure: 'MyGoldFolio fournit des outils de suivi, pas des conseils d’investissement, juridiques ou fiscaux.', consentPrompt: 'Activez les cookies fonctionnels pour voir le graphique interactif TradingView.', relatedGuide: 'Lisez notre guide de suivi de portefeuille' },
  tr: { code: 'tr', locale: 'tr-TR', label: 'TR', marketPath: '/tr/market/', hubPath: '/tr/rehber/', hubLabel: 'Rehber', homeLabel: 'Ana sayfa', helpLabel: 'Yardım', privacyLabel: 'Gizlilik', appLabel: 'Uygulamayı edin', marketLabel: 'Canlı Piyasa', marketHubTitle: 'Canlı Değerli Maden Fiyatları', marketHubIntro: 'Altın, gümüş, platin ve paladyum için gerçek zamanlı fiyatları takip edin.', ctaLabel: 'Uygulamayı ücretsiz indir', disclosure: 'MyGoldFolio takip araçları sunar; yatırım, hukuk veya vergi tavsiyesi vermez.', consentPrompt: 'Etkileşimli TradingView grafiğini görmek için işlevsel çerezleri etkinleştirin.', relatedGuide: 'Portföy takip rehberimizi okuyun' },
  es: { code: 'es', locale: 'es-ES', label: 'ES', marketPath: '/es/market/', hubPath: '/es/guias/', hubLabel: 'Guías', homeLabel: 'Inicio', helpLabel: 'Ayuda', privacyLabel: 'Privacidad', appLabel: 'Obtener app', marketLabel: 'Mercado en vivo', marketHubTitle: 'Precios de metales preciosos en vivo', marketHubIntro: 'Sigue los precios en tiempo real del oro, la plata, el platino y el paladio.', ctaLabel: 'Descargar App gratis', disclosure: 'MyGoldFolio ofrece herramientas de seguimiento, no asesoramiento de inversión, legal ni fiscal.', consentPrompt: 'Activa las cookies funcionales para ver el gráfico interactivo de TradingView.', relatedGuide: 'Lee nuestra guía de seguimiento de cartera' },
  it: { code: 'it', locale: 'it-IT', label: 'IT', marketPath: '/it/market/', hubPath: '/it/guide/', hubLabel: 'Guide', homeLabel: 'Home', helpLabel: 'Aiuto', privacyLabel: 'Privacy', appLabel: 'Ottieni app', marketLabel: 'Mercato in tempo reale', marketHubTitle: 'Prezzi dei metalli preziosi in tempo reale', marketHubIntro: 'Monitora i prezzi in tempo reale di oro, argento, platino e palladio.', ctaLabel: 'Scarica l\'App gratis', disclosure: 'MyGoldFolio offre strumenti di monitoraggio, non consulenza finanziaria, legale o fiscale.', consentPrompt: 'Abilita i cookie funzionali per visualizzare il grafico interattivo di TradingView.', relatedGuide: 'Leggi la nostra guida al monitoraggio del portafoglio' },
  pt: { code: 'pt', locale: 'pt-BR', label: 'PT-BR', marketPath: '/pt/market/', hubPath: '/pt/guias/', hubLabel: 'Guias', homeLabel: 'Início', helpLabel: 'Ajuda', privacyLabel: 'Privacidade', appLabel: 'Obter app', marketLabel: 'Mercado ao vivo', marketHubTitle: 'Preços de metais preciosos ao vivo', marketHubIntro: 'Acompanhe os preços em tempo real de ouro, prata, platina e paládio.', ctaLabel: 'Baixar App grátis', disclosure: 'MyGoldFolio oferece ferramentas de acompanhamento, não aconselhamento de investimento, jurídico ou tributário.', consentPrompt: 'Ative os cookies funcionais para ver o gráfico interativo do TradingView.', relatedGuide: 'Leia nosso guia de acompanhamento de carteira' }
};

export const metals = [
  {
    id: 'gold',
    symbol: 'GOLD',
    tvSymbol: 'OANDA:XAUUSD',
    theme: 'gold',
    locales: {
      en: { title: 'Live Gold Price Chart', description: 'Track the live gold price and view historical charts. Use MyGoldFolio to manage your physical gold investments offline.', seoTitle: 'Live Gold Price Chart | MyGoldFolio', ctaTitle: 'Track your gold portfolio' },
      de: { title: 'Live Goldpreis-Chart', description: 'Verfolge den aktuellen Goldpreis und betrachte historische Charts. Nutze MyGoldFolio, um deine physischen Goldinvestitionen offline zu verwalten.', seoTitle: 'Live Goldpreis-Chart | MyGoldFolio', ctaTitle: 'Verfolge dein Gold-Portfolio' },
      fr: { title: 'Graphique du cours de l\'or en direct', description: 'Suivez le prix de l\'or en direct et consultez les graphiques historiques. Utilisez MyGoldFolio pour gérer vos investissements en or physique hors ligne.', seoTitle: 'Graphique du cours de l\'or en direct | MyGoldFolio', ctaTitle: 'Suivez votre portefeuille d\'or' },
      tr: { title: 'Canlı Altın Fiyatı Grafiği', description: 'Canlı altın fiyatını takip edin ve geçmiş grafikleri görüntüleyin. Fiziksel altın yatırımlarınızı çevrimdışı yönetmek için MyGoldFolio\'yu kullanın.', seoTitle: 'Canlı Altın Fiyatı Grafiği | MyGoldFolio', ctaTitle: 'Altın portföyünüzü takip edin' },
      es: { title: 'Gráfico del precio del oro en vivo', description: 'Sigue el precio del oro en vivo y visualiza gráficos históricos. Usa MyGoldFolio para gestionar tus inversiones en oro físico sin conexión.', seoTitle: 'Gráfico del precio del oro en vivo | MyGoldFolio', ctaTitle: 'Haz un seguimiento de tu cartera de oro' },
      it: { title: 'Grafico del prezzo dell\'oro in tempo reale', description: 'Tieni traccia del prezzo dell\'oro in tempo reale e visualizza i grafici storici. Usa MyGoldFolio per gestire i tuoi investimenti in oro fisico offline.', seoTitle: 'Grafico del prezzo dell\'oro in tempo reale | MyGoldFolio', ctaTitle: 'Monitora il tuo portafoglio in oro' },
      pt: { title: 'Gráfico do preço do ouro ao vivo', description: 'Acompanhe o preço do ouro ao vivo e veja gráficos históricos. Use o MyGoldFolio para gerenciar seus investimentos em ouro físico offline.', seoTitle: 'Gráfico do preço do ouro ao vivo | MyGoldFolio', ctaTitle: 'Acompanhe sua carteira de ouro' }
    }
  },
  {
    id: 'silver',
    symbol: 'SILVER',
    tvSymbol: 'OANDA:XAGUSD',
    theme: 'slate',
    locales: {
      en: { title: 'Live Silver Price Chart', description: 'Track the live silver price and view historical charts. Keep an eye on the gold-silver ratio and manage your physical silver stack securely offline.', seoTitle: 'Live Silver Price Chart | MyGoldFolio', ctaTitle: 'Track your silver portfolio' },
      de: { title: 'Live Silberpreis-Chart', description: 'Verfolge den aktuellen Silberpreis und betrachte historische Charts. Behalte das Gold-Silber-Ratio im Auge und verwalte deinen Silberbestand sicher offline.', seoTitle: 'Live Silberpreis-Chart | MyGoldFolio', ctaTitle: 'Verfolge dein Silber-Portfolio' },
      fr: { title: 'Graphique du cours de l\'argent en direct', description: 'Suivez le prix de l\'argent en direct et consultez les graphiques historiques. Gardez un œil sur le ratio or-argent et gérez votre argent physique hors ligne en toute sécurité.', seoTitle: 'Graphique du cours de l\'argent en direct | MyGoldFolio', ctaTitle: 'Suivez votre portefeuille d\'argent' },
      tr: { title: 'Canlı Gümüş Fiyatı Grafiği', description: 'Canlı gümüş fiyatını takip edin ve geçmiş grafikleri görüntüleyin. Altın-gümüş oranını göz önünde bulundurun ve fiziksel gümüş birikiminizi güvenle çevrimdışı yönetin.', seoTitle: 'Canlı Gümüş Fiyatı Grafiği | MyGoldFolio', ctaTitle: 'Gümüş portföyünüzü takip edin' },
      es: { title: 'Gráfico del precio de la plata en vivo', description: 'Sigue el precio de la plata en vivo y visualiza gráficos históricos. Presta atención a la relación oro-plata y gestiona tu plata física de forma segura sin conexión.', seoTitle: 'Gráfico del precio de la plata en vivo | MyGoldFolio', ctaTitle: 'Haz un seguimiento de tu cartera de plata' },
      it: { title: 'Grafico del prezzo dell\'argento in tempo reale', description: 'Tieni traccia del prezzo dell\'argento in tempo reale e visualizza i grafici storici. Tieni d\'occhio il rapporto oro-argento e gestisci il tuo argento fisico offline in modo sicuro.', seoTitle: 'Grafico del prezzo dell\'argento in tempo reale | MyGoldFolio', ctaTitle: 'Monitora il tuo portafoglio in argento' },
      pt: { title: 'Gráfico do preço da prata ao vivo', description: 'Acompanhe o preço da prata ao vivo e veja gráficos históricos. Fique de olho na relação ouro-prata e gerencie sua prata física com segurança offline.', seoTitle: 'Gráfico do preço da prata ao vivo | MyGoldFolio', ctaTitle: 'Acompanhe sua carteira de prata' }
    }
  },
  {
    id: 'platinum',
    symbol: 'PLATINUM',
    tvSymbol: 'OANDA:XPTUSD',
    theme: 'teal',
    locales: {
      en: { title: 'Live Platinum Price Chart', description: 'Track the live platinum price and view historical charts. Monitor industrial demand and manage your physical platinum investments offline with MyGoldFolio.', seoTitle: 'Live Platinum Price Chart | MyGoldFolio', ctaTitle: 'Track your platinum portfolio' },
      de: { title: 'Live Platinpreis-Chart', description: 'Verfolge den aktuellen Platinpreis und betrachte historische Charts. Überwache die industrielle Nachfrage und verwalte deine physischen Platininvestitionen offline.', seoTitle: 'Live Platinpreis-Chart | MyGoldFolio', ctaTitle: 'Verfolge dein Platin-Portfolio' },
      fr: { title: 'Graphique du cours du platine en direct', description: 'Suivez le prix du platine en direct et consultez les graphiques historiques. Surveillez la demande industrielle et gérez vos investissements en platine physique hors ligne.', seoTitle: 'Graphique du cours du platine en direct | MyGoldFolio', ctaTitle: 'Suivez votre portefeuille de platine' },
      tr: { title: 'Canlı Platin Fiyatı Grafiği', description: 'Canlı platin fiyatını takip edin ve geçmiş grafikleri görüntüleyin. Endüstriyel talebi izleyin ve fiziksel platin yatırımlarınızı çevrimdışı yönetin.', seoTitle: 'Canlı Platin Fiyatı Grafiği | MyGoldFolio', ctaTitle: 'Platin portföyünüzü takip edin' },
      es: { title: 'Gráfico del precio del platino en vivo', description: 'Sigue el precio del platino en vivo y visualiza gráficos históricos. Supervisa la demanda industrial y gestiona tus inversiones en platino físico sin conexión.', seoTitle: 'Gráfico del precio del platino en vivo | MyGoldFolio', ctaTitle: 'Haz un seguimiento de tu cartera de platino' },
      it: { title: 'Grafico del prezzo del platino in tempo reale', description: 'Tieni traccia del prezzo del platino in tempo reale e visualizza i grafici storici. Monitora la domanda industriale e gestisci i tuoi investimenti in platino fisico offline.', seoTitle: 'Grafico del prezzo del platino in tempo reale | MyGoldFolio', ctaTitle: 'Monitora il tuo portafoglio in platino' },
      pt: { title: 'Gráfico do preço da platina ao vivo', description: 'Acompanhe o preço da platina ao vivo e veja gráficos históricos. Monitore a demanda industrial e gerencie seus investimentos em platina física offline.', seoTitle: 'Gráfico do preço da platina ao vivo | MyGoldFolio', ctaTitle: 'Acompanhe sua carteira de platina' }
    }
  },
  {
    id: 'palladium',
    symbol: 'PALLADIUM',
    tvSymbol: 'OANDA:XPDUSD',
    theme: 'indigo',
    locales: {
      en: { title: 'Live Palladium Price Chart', description: 'Track the live palladium price and view historical charts. Stay updated on market movements and manage your physical palladium offline.', seoTitle: 'Live Palladium Price Chart | MyGoldFolio', ctaTitle: 'Track your palladium portfolio' },
      de: { title: 'Live Palladiumpreis-Chart', description: 'Verfolge den aktuellen Palladiumpreis und betrachte historische Charts. Bleibe über Marktbewegungen informiert und verwalte dein physisches Palladium offline.', seoTitle: 'Live Palladiumpreis-Chart | MyGoldFolio', ctaTitle: 'Verfolge dein Palladium-Portfolio' },
      fr: { title: 'Graphique du cours du palladium en direct', description: 'Suivez le prix du palladium en direct et consultez les graphiques historiques. Restez informé des mouvements du marché et gérez votre palladium physique hors ligne.', seoTitle: 'Graphique du cours du palladium en direct | MyGoldFolio', ctaTitle: 'Suivez votre portefeuille de palladium' },
      tr: { title: 'Canlı Paladyum Fiyatı Grafiği', description: 'Canlı paladyum fiyatını takip edin ve geçmiş grafikleri görüntüleyin. Piyasa hareketlerinden haberdar olun ve fiziksel paladyumunuzu çevrimdışı yönetin.', seoTitle: 'Canlı Paladyum Fiyatı Grafiği | MyGoldFolio', ctaTitle: 'Paladyum portföyünüzü takip edin' },
      es: { title: 'Gráfico del precio del paladio en vivo', description: 'Sigue el precio del paladio en vivo y visualiza gráficos históricos. Mantente actualizado sobre los movimientos del mercado y gestiona tu paladio físico sin conexión.', seoTitle: 'Gráfico del precio del paladio en vivo | MyGoldFolio', ctaTitle: 'Haz un seguimiento de tu cartera de paladio' },
      it: { title: 'Grafico del prezzo del palladio in tempo reale', description: 'Tieni traccia del prezzo del palladio in tempo reale e visualizza i grafici storici. Tieniti aggiornato sui movimenti del mercato e gestisci il tuo palladio fisico offline.', seoTitle: 'Grafico del prezzo del palladio in tempo reale | MyGoldFolio', ctaTitle: 'Monitora il tuo portafoglio in palladio' },
      pt: { title: 'Gráfico do preço do paládio ao vivo', description: 'Acompanhe o preço do paládio ao vivo e veja gráficos históricos. Fique por dentro dos movimentos do mercado e gerencie seu paládio físico offline.', seoTitle: 'Gráfico do preço do paládio ao vivo | MyGoldFolio', ctaTitle: 'Acompanhe sua carteira de paládio' }
    }
  }
];

export function marketPath(metal, locale) {
  const base = locale.code === 'en' ? '/market/' : `/${locale.code}/market/`;
  return `${base}${metal.id}/`;
}
