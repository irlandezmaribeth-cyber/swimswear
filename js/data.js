/* Saltline Swim — catalogue data: categories, sizes, icon paths and products */
const C=["Two-piece","Accessories"],SZ=["XS","S","M","L","XL"];
const D={"Two-piece":"Mix-and-match set with an adjustable fit. Chlorine-resistant fabric.","Accessories":"Made for pool days and beach afternoons."};
const SH={o:'<path d="M34 10h9l1 22q6 8 12 0l1-22h9l-3 30q-5 14-1 32-12 12-24 0 4-18-1-32z"/>',b:'<path d="M16 22h26L29 48zM58 22h26L71 48zM30 62h40L56 84H44z"/><path d="M16 22Q50 10 84 22" fill="none" stroke-width="1.6"/>',t:'<path d="M22 28h56l4 38-26 2-4-16-4 16-26-2z"/>',r:'<path d="M36 16l14 6 14-6 26 24-10 12-10-8v44H30V44l-10 8L10 40z"/>',c:'<path d="M28 12h14l8 12 8-12h14l14 76H62L50 32 38 88H14z"/>'};
const P=[
[1,"Limoncello Triangle Set","Two-piece",52,"y","Lemon yellow|#F4D21F","Bestseller",4.8],
[2,"Fuchsia String Set","Two-piece",48,"pk","Fuchsia|#E24BB4","New",4.7],
[3,"Lagoon Tie-Side Set","Two-piece",54,"tl","Lagoon teal|#1AA39A","Bestseller",4.9],
[4,"Olive Tie Set","Two-piece",54,"ol","Olive|#7C8660","",4.6],
[5,"Stripe Swim Ring","Accessories",28,"rg","Sky blue|#9DB8C9","New",4.8],
[6,"Fringe Beach Towel","Accessories",36,"tw","Sunshine stripe|#F2C53D","",4.7]
].map(a=>({id:a[0],n:a[1],c:a[2],p:a[3],s:a[4],k:a[5].split(",").map(x=>{const y=x.split("|");return{n:y[0],h:y[1],t:y[2]}}),b:a[6],r:a[7]}));
