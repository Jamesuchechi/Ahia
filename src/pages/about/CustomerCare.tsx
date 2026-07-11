import { useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import AboutSidebar from "../../components/about/AboutSidebar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const CustomerCare = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save submission to supabase database table
      const { error: dbError } = await supabase
        .from("contact_messages")
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          order_number: orderNumber.trim() || null,
          message: message.trim(),
        });

      if (dbError) throw dbError;

      // 2. Invoke send-contact-email Edge Function to alert the admin
      const { error: funcError } = await supabase.functions.invoke("send-contact-email", {
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          order_number: orderNumber.trim() || null,
          message: message.trim(),
        },
      });

      if (funcError) {
        console.error("Failed to trigger contact email alert:", funcError);
      }

      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            title="Customer Care" 
            subtitle="We're here to help you with all your jewelry needs"
          />
          
          <ContentSection title="Contact Information">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Phone</h3>
                <p className="text-muted-foreground">+1 (555) 123-4567</p>
                <p className="text-sm text-muted-foreground">Mon-Fri: 9AM-6PM EST<br />Sat: 10AM-4PM EST</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Email</h3>
                <p className="text-muted-foreground">care@Ahiajewelry.com</p>
                <p className="text-sm text-muted-foreground">Response within 24 hours</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Live Chat</h3>
                <Button variant="outline" className="rounded-none">
                  Start Chat
                </Button>
                <p className="text-sm text-muted-foreground">Available during business hours</p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Frequently Asked Questions">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="shipping" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What are your shipping options and timeframes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We offer free standard shipping (3-5 business days) on orders over $500. Express shipping (1-2 business days) is available for $25. All orders are fully insured and require signature confirmation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="returns" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What is your return and exchange policy?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We offer a 30-day return policy for unworn items in original condition. Custom and engraved pieces are final sale. Returns are free with our prepaid return label.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="warranty" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What warranty do you offer on your jewelry?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  All Ahia jewelry comes with a lifetime warranty against manufacturing defects. This includes free repairs for normal wear and tear, stone tightening, and professional cleaning.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sizing" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I resize my jewelry after purchase?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, we offer free ring resizing within 60 days of purchase (up to 2 sizes). Additional resizing is available for a service fee. Some designs cannot be resized due to their construction.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="care" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How should I care for my Ahia jewelry?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Store pieces separately in soft pouches, avoid contact with chemicals and cosmetics, and clean gently with a soft cloth. We recommend professional cleaning every 6-12 months.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="authentication" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How can I verify the authenticity of my jewelry?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Every Ahia piece comes with a certificate of authenticity and is hallmarked. You can verify authenticity on our website using your unique piece number or contact our customer care team.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ContentSection>

          <ContentSection title="Contact Form">
            <div>
              {submitted ? (
                <div className="border border-border p-8 text-center space-y-4 animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto stroke-[1.2]" />
                  <h3 className="text-xl font-light text-foreground">Message Sent</h3>
                  <p className="text-sm font-light text-muted-foreground max-w-md mx-auto">
                    Thank you for reaching out to us. We've received your request and will get back to you at <strong>{email}</strong> within 24 hours.
                  </p>
                  <Button 
                    variant="outline" 
                    className="rounded-none mt-4 font-light"
                    onClick={() => {
                      setSubmitted(false);
                      setFirstName("");
                      setLastName("");
                      setEmail("");
                      setOrderNumber("");
                      setMessage("");
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-light text-foreground">First Name *</label>
                      <Input 
                        className="rounded-none bg-background font-light" 
                        placeholder="Enter your first name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-light text-foreground">Last Name *</label>
                      <Input 
                        className="rounded-none bg-background font-light" 
                        placeholder="Enter your last name" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-light text-foreground">Email *</label>
                    <Input 
                      type="email" 
                      className="rounded-none bg-background font-light" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-light text-foreground">Order Number (Optional)</label>
                    <Input 
                      className="rounded-none bg-background font-light" 
                      placeholder="Enter your order number if applicable" 
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-light text-foreground">How can we help you? *</label>
                    <Textarea 
                      className="rounded-none min-h-[120px] bg-background font-light" 
                      placeholder="Please describe your inquiry in detail"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full rounded-none font-light gap-2"
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? "Sending Message..." : "Send Message"}</span>
                  </Button>
                </form>
              )}
            </div>
          </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default CustomerCare;