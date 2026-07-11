-- Phase 8: Notifications table and order status triggers

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type IN ('order_status', 'general', 'alert')),
    read boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to automatically create a notification when an order status changes
CREATE OR REPLACE FUNCTION public.handle_order_status_notification()
RETURNS trigger AS $$
DECLARE
    title_text text;
    msg_text text;
BEGIN
    -- Only trigger if status actually changed on update
    IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
        RETURN NEW;
    END IF;

    -- Custom title & message based on status
    IF NEW.status = 'paid' THEN
        title_text := 'Payment Confirmed';
        msg_text := 'Thank you! Your payment for order ' || substring(NEW.id::text from 1 for 8) || ' has been confirmed. We are processing it now.';
    ELSIF NEW.status = 'shipped' THEN
        title_text := 'Order Shipped';
        msg_text := 'Great news! Your order ' || substring(NEW.id::text from 1 for 8) || ' has been shipped and is on its way.';
    ELSIF NEW.status = 'delivered' THEN
        title_text := 'Order Delivered';
        msg_text := 'Your order ' || substring(NEW.id::text from 1 for 8) || ' has been successfully delivered. Enjoy!';
    ELSIF NEW.status = 'cancelled' THEN
        title_text := 'Order Cancelled';
        msg_text := 'Your order ' || substring(NEW.id::text from 1 for 8) || ' has been cancelled.';
    ELSIF NEW.status = 'refunded' THEN
        title_text := 'Order Refunded';
        msg_text := 'Your payment for order ' || substring(NEW.id::text from 1 for 8) || ' has been refunded.';
    ELSE
        title_text := 'Order Placed';
        msg_text := 'Your order ' || substring(NEW.id::text from 1 for 8) || ' has been placed successfully and is pending payment.';
    END IF;

    -- Only create notification if order is linked to a user
    IF NEW.user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (NEW.user_id, title_text, msg_text, 'order_status');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_order_status_change
    AFTER INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_notification();
