
async function test() {
  const query = "2 allée renée dumont illkirch";
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=5&addressdetails=1`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
