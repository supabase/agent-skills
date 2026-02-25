import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
	try {
		const { orderId } = await req.json();

		const supabase = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_ANON_KEY") ?? "",
		);

		const { data, error } = await supabase
			.from("orders")
			.select("*")
			.eq("id", orderId)
			.single();

		if (error) throw error;

		return new Response(JSON.stringify({ order: data }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: String(err) }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});
