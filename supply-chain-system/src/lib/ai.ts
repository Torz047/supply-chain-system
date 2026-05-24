export async function aiParseOrder(text: string) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/google/flan-t5-base',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Extract order number, customer name, and items with quantities and prices from this text: ${text}`,
      }),
    }
  );
  return await response.json();
}
