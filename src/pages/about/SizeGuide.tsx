import { useSearchParams, Link } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import AboutSidebar from "../../components/about/AboutSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SizeGuide = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "apparel";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader 
            title="Size Guide" 
            subtitle="Find your perfect fit across our product collections"
          />

          <div className="mb-10">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-border p-0 h-11 space-x-8">
                <TabsTrigger 
                  value="apparel" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground bg-transparent data-[state=active]:bg-transparent px-0 py-3 text-sm font-light text-muted-foreground data-[state=active]:text-foreground shadow-none"
                >
                  Apparel & Clothing
                </TabsTrigger>
                <TabsTrigger 
                  value="footwear" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground bg-transparent data-[state=active]:bg-transparent px-0 py-3 text-sm font-light text-muted-foreground data-[state=active]:text-foreground shadow-none"
                >
                  Footwear
                </TabsTrigger>
                <TabsTrigger 
                  value="jewelry" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground bg-transparent data-[state=active]:bg-transparent px-0 py-3 text-sm font-light text-muted-foreground data-[state=active]:text-foreground shadow-none"
                >
                  Jewelry & Accessories
                </TabsTrigger>
              </TabsList>

              {/* Apparel Sizing */}
              <TabsContent value="apparel" className="mt-8 space-y-8 animate-fade-in">
                <div className="bg-muted/10 rounded-lg p-6 md:p-8">
                  <h3 className="text-lg font-light text-foreground mb-4">How to Measure Apparel</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">1. Chest / Bust</h4>
                      <p className="text-muted-foreground font-light leading-relaxed">
                        Measure around the fullest part of your chest, keeping the tape horizontal under your arms.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">2. Waist</h4>
                      <p className="text-muted-foreground font-light leading-relaxed">
                        Measure around your natural waistline (typically where your body bends side to side), keeping the tape slightly loose.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">3. Hips</h4>
                      <p className="text-muted-foreground font-light leading-relaxed">
                        Measure around the fullest part of your hips, keeping your feet together.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border border-border p-3 text-left font-light">Size</th>
                        <th className="border border-border p-3 text-left font-light">US / EU Size</th>
                        <th className="border border-border p-3 text-left font-light">Chest (cm)</th>
                        <th className="border border-border p-3 text-left font-light">Waist (cm)</th>
                        <th className="border border-border p-3 text-left font-light">Hips (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: "XS", useu: "34", chest: "82 - 86", waist: "62 - 66", hips: "88 - 92" },
                        { size: "S", useu: "36", chest: "86 - 90", waist: "66 - 70", hips: "92 - 96" },
                        { size: "M", useu: "38", chest: "90 - 94", waist: "70 - 74", hips: "96 - 100" },
                        { size: "L", useu: "40", chest: "94 - 98", waist: "74 - 78", hips: "100 - 104" },
                        { size: "XL", useu: "42", chest: "98 - 102", waist: "78 - 82", hips: "104 - 108" },
                        { size: "XXL", useu: "44", chest: "102 - 106", waist: "82 - 86", hips: "108 - 112" },
                      ].map((item, index) => (
                        <tr key={index} className="hover:bg-muted/10 font-light">
                          <td className="border border-border p-3 font-medium">{item.size}</td>
                          <td className="border border-border p-3">{item.useu}</td>
                          <td className="border border-border p-3">{item.chest}</td>
                          <td className="border border-border p-3">{item.waist}</td>
                          <td className="border border-border p-3">{item.hips}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Footwear Sizing */}
              <TabsContent value="footwear" className="mt-8 space-y-8 animate-fade-in">
                <div className="bg-muted/10 rounded-lg p-6 md:p-8">
                  <h3 className="text-lg font-light text-foreground mb-4">How to Measure Foot Length</h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-2xl">
                    Place a sheet of paper on the floor against a wall. Stand on the paper with your heel lightly touching the wall. Mark the longest part of your foot on the paper, and measure the distance in centimeters.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border border-border p-3 text-left font-light">EU Size</th>
                        <th className="border border-border p-3 text-left font-light">US Women</th>
                        <th className="border border-border p-3 text-left font-light">US Men</th>
                        <th className="border border-border p-3 text-left font-light">UK Size</th>
                        <th className="border border-border p-3 text-left font-light">Foot Length (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { eu: "36", usw: "6", usm: "4.5", uk: "3.5", len: "22.5" },
                        { eu: "37", usw: "6.5", usm: "5", uk: "4", len: "23.0" },
                        { eu: "38", usw: "7.5", usm: "6", uk: "5", len: "24.0" },
                        { eu: "39", usw: "8.5", usm: "7", uk: "6", len: "24.5" },
                        { eu: "40", usw: "9", usm: "7.5", uk: "6.5", len: "25.0" },
                        { eu: "41", usw: "9.5", usm: "8", uk: "7", len: "25.5" },
                        { eu: "42", usw: "10.5", usm: "9", uk: "8", len: "26.5" },
                        { eu: "43", usw: "11.5", usm: "10", uk: "9", len: "27.5" },
                      ].map((item, index) => (
                        <tr key={index} className="hover:bg-muted/10 font-light">
                          <td className="border border-border p-3 font-medium">{item.eu}</td>
                          <td className="border border-border p-3">{item.usw}</td>
                          <td className="border border-border p-3">{item.usm}</td>
                          <td className="border border-border p-3">{item.uk}</td>
                          <td className="border border-border p-3">{item.len}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Jewelry & Accessories Sizing */}
              <TabsContent value="jewelry" className="mt-8 space-y-8 animate-fade-in">
                <div className="bg-muted/10 rounded-lg p-6 md:p-8">
                  <h3 className="text-lg font-light text-foreground mb-4">How to Measure Rings</h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Using a Ring You Own</h4>
                      <p className="text-muted-foreground font-light leading-relaxed">
                        Measure the inside diameter of a ring that fits you in millimeters. Compare to the table below.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Using Paper Wrap</h4>
                      <p className="text-muted-foreground font-light leading-relaxed">
                        Wrap a strip of paper around your finger. Mark the meeting point, measure the length in millimeters to get your circumference.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border border-border p-3 text-left font-light">US Size</th>
                        <th className="border border-border p-3 text-left font-light">UK Size</th>
                        <th className="border border-border p-3 text-left font-light">EU Size</th>
                        <th className="border border-border p-3 text-left font-light">Diameter (mm)</th>
                        <th className="border border-border p-3 text-left font-light">Circumference (mm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { us: "5", uk: "J", eu: "49", diameter: "15.6", circumference: "49.0" },
                        { us: "5.5", uk: "K", eu: "50", diameter: "16.0", circumference: "50.2" },
                        { us: "6", uk: "L", eu: "51", diameter: "16.4", circumference: "51.5" },
                        { us: "6.5", uk: "M", eu: "52", diameter: "16.8", circumference: "52.8" },
                        { us: "7", uk: "N", eu: "54", diameter: "17.2", circumference: "54.0" },
                        { us: "7.5", uk: "O", eu: "55", diameter: "17.6", circumference: "55.3" },
                        { us: "8", uk: "P", eu: "56", diameter: "18.0", circumference: "56.5" },
                        { us: "8.5", uk: "Q", eu: "57", diameter: "18.4", circumference: "57.8" },
                        { us: "9", uk: "R", eu: "59", diameter: "18.8", circumference: "59.1" }
                      ].map((size, index) => (
                        <tr key={index} className="hover:bg-muted/10 font-light">
                          <td className="border border-border p-3 font-medium">{size.us}</td>
                          <td className="border border-border p-3">{size.uk}</td>
                          <td className="border border-border p-3">{size.eu}</td>
                          <td className="border border-border p-3">{size.diameter}</td>
                          <td className="border border-border p-3">{size.circumference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-foreground">Bracelet Sizes</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-border font-light">
                        <span className="text-muted-foreground">Small</span>
                        <span className="text-foreground">6.5" - 7" (16.5 - 18cm)</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border font-light">
                        <span className="text-muted-foreground">Medium</span>
                        <span className="text-foreground">7" - 7.5" (18 - 19cm)</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border font-light">
                        <span className="text-muted-foreground">Large</span>
                        <span className="text-foreground">7.5" - 8" (19 - 20.3cm)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-foreground">Necklace Lengths</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-border font-light">
                        <span className="text-muted-foreground">Choker</span>
                        <span className="text-foreground">14" - 16" (35 - 40cm)</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border font-light">
                        <span className="text-muted-foreground">Princess</span>
                        <span className="text-foreground">17" - 19" (43 - 48cm)</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border font-light">
                        <span className="text-muted-foreground">Matinee</span>
                        <span className="text-foreground">20" - 24" (50 - 60cm)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <ContentSection title="Need Help?">
            <div className="space-y-6">
              <p className="text-muted-foreground font-light leading-relaxed">
                Still unsure about sizing? Our customer care specialists are here to help you find the perfect fit. 
                Get in touch for personal support or advice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="rounded-none font-light">
                  Download PDF Guide
                </Button>
                <Button className="rounded-none font-light" asChild>
                  <Link to="/about/customer-care">Contact Customer Care</Link>
                </Button>
              </div>
            </div>
          </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default SizeGuide;