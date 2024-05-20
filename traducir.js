const traductor = require('node-google-translate-skidz')
const fs = require('fs').promises
function traducir(texto){
    Translate({
        text: texto,
        source:"en",//origen
        target:"es",//destino
    }, function(result){
        return traduccion.translation;
    })
}
async function procesarProductos(productos){
    for (let producto of productos){
        producto.title= await traducir(producto.title);
        producto.description= await traducir(producto.description);
        producto.category= await traducir(producto.category);
    }
    //DESCUENTOS  agrego json con descuentos
    let descuentos = await fs.readFile("descuentos.json")
    descuentos = JSON.parse(descuentos)

    let desc
    for (producto of productos){
        desc = descuentos.filter((descuento) => {
        return descuento.id === producto.id
    })
    if (desc.length > 0) {
        producto.descuento = desc[0].descuento
    }
    }
        return productos
    }

module.exports = { procesarProductos };
 
