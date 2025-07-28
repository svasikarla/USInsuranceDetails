import Head from 'next/head';
import LandingPage from '../components/LandingPage';

const HomePage = () => {
  return (
    <>
      <Head>
        <title>InsureAI - AI-Powered Insurance Policy Analysis Platform</title>
        <meta
          name="description"
          content="Transform your insurance analysis with AI-powered document processing, red flag detection, and policy comparison. Save time, reduce costs, and make smarter insurance decisions."
        />
        <meta
          name="keywords"
          content="insurance analysis, AI policy review, red flag detection, insurance comparison, document processing, policy management"
        />
        <meta name="author" content="InsureAI Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://insureai.com/" />
        <meta property="og:title" content="InsureAI - AI-Powered Insurance Policy Analysis" />
        <meta property="og:description" content="Transform your insurance analysis with AI-powered document processing and red flag detection." />
        <meta property="og:image" content="/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://insureai.com/" />
        <meta property="twitter:title" content="InsureAI - AI-Powered Insurance Policy Analysis" />
        <meta property="twitter:description" content="Transform your insurance analysis with AI-powered document processing and red flag detection." />
        <meta property="twitter:image" content="/twitter-image.jpg" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "InsureAI Platform",
              "description": "AI-powered insurance policy analysis platform for document processing, red flag detection, and policy comparison",
              "url": "https://insureai.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "14-day free trial"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1200"
              }
            })
          }}
        />

        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://insureai.com/" />
      </Head>
      <LandingPage />
    </>
  );
};

export default HomePage;
