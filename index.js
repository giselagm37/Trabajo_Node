const express = require('express');
const app = express();
const pug = require('pug')
const traductor = require('node-google-translate-skidz')
const fs = require('fs').promises //PARA LEER Y ESCRIBIR ARCHIVOS
const path = require('path');


//MIDDELLWAR para poder usar archivos publicos
app.use(express.static('public'));
//para poder cargar datos en el cuerpo del requerimiento x formulario post
app.use(express.urlencoded({extended:true}))
//
app.use(express.json())

app.set('view engine','pug')
app.set('views','./vistas')
app.set('views', path.join(__dirname, './vistas'));

async function traducir(texto){
    const traduccion = await traductor(
        {
        text: texto,
        source:"en",//origen
        target:"es",//traduccion
    })
    return traduccion.translation;
    
}

//hacer funcion
//RUTA RAIZ
app.get('/', async (req, res) =>{
    try{
        const response = await fetch('http://fakestoreapi.com/products')
        const productos = await response.json()
  //TRADUCCION  
    for (producto of productos){
        producto.title= await traducir(producto.title);
        producto.description= await traducir(producto.description);
        producto.category= await traducir(producto.category);
    }
  //DESCUENTOS  agrego json con descuentos
   let descuentos = await fs.readFile("descuentos.json")
    descuentos = JSON.parse(descuentos)
   
    for (let producto of productos) {
        let desc = descuentos.find((descuento) => descuento.id === producto.id);
        if (desc) {
            producto.descuento = desc.descuento;
            producto.priceConDes = producto.price - (producto.price * (desc.descuento / 100));
        } else {
            producto.priceConDes = producto.price;
        }
        //REDONDEAR
        producto.price = Math.round(producto.price * 100) / 100;
        producto.priceConDes = Math.round(producto.priceConDes * 100) / 100;
    }
    


  //VISTAS DE PUG con productos traducidos y con sescuento
        console.log(productos)
        res.render('index',{productos:productos})
    }catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los productos');
}
});


let carrito = [];

// AGREGA ALA CARRITO
app.post('/agregar', (req, res) => {
    
    const productoId = parseInt(req.body.id);
    let productoExistente = carrito.find(producto => producto.id === productoId);

    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        const nuevoProducto = {
            id: productoId,
            title: req.body.title,
            price: parseFloat(req.body.price)|| 0,
            priceConDesc: parseFloat(req.body.priceConDesc) ,
            image: req.body.image,
            cantidad: 1
        };
        carrito.push(nuevoProducto);
    }
    console.log(typeof producto.price); /// 'number'
    console.log(typeof producto.priceConDes); // 'number'

    res.redirect('/carrito');
});

// SUMA PRODUCTO
app.post('/carrito/sumar', (req, res) => {
    const { id } = req.body;
    const producto = carrito.find(p => p.id === parseInt(id));
    if (producto) {
        producto.cantidad++;
    }
    res.redirect('/carrito');
});

// RESTA PRODUCTOS
app.post('/carrito/restar', (req, res) => {
    const { id } = req.body;
    const producto = carrito.find(p => p.id === parseInt(id));
    if (producto && producto.cantidad > 1) {
        producto.cantidad--;
    }
    res.redirect('/carrito');
});

// ELIMINAR PRODUCTO
app.post('/eliminar', (req, res) => {
    const productoId = parseInt(req.body.id);
    carrito = carrito.filter(producto => producto.id !== productoId);
    res.redirect('/carrito');
});

// Calcular el total del carrito
const calcularTotal = (carrito) => {
    return carrito.reduce((total, p) => {
        const priceConDesc = parseFloat(p.priceConDesc);
        const cantidad = parseFloat(p.cantidad);
        if (!isNaN(priceConDesc) && !isNaN(cantidad)) {
            return total + (priceConDesc * cantidad);
        }
        return total;
    }, 0).toFixed(2);
};

// Ruta para mostrar el carrito
app.get('/carrito', (req, res) => {
    const total = calcularTotal(carrito);
    res.render('carrito', { carrito, total });
});

// COMPRA Y REGISTRA EN UN JSON
app.post('/comprar', async (req, res) => {
    try {
        const compra = {
            productos: carrito,
            total: carrito.reduce((total, producto) => total + producto.priceConDesc * producto.cantidad, 0),
            fecha: new Date()
        };
       
        let compras = await fs.promises.readFile('./compras.json', 'utf8');
        compras = JSON.parse(compras);
        
        
        compra.id = compras.length ? compras[compras.length - 1].id + 1 : 1;
        compras.push(compra);

        await fs.promises.writeFile('./compras.json', JSON.stringify(compras, null, 2));
        carrito.length = 0; // Vaciar el carrito después de la compra
     ///   
       

        res.json({ error: false, message: "Se registró su compra exitosamente" });
    } catch (error) {
        res.json({ error: true, message: "Su compra no fue registrada" });
    }
});

// Ruta para mostrar el carrito
app.get('/carrito', (req, res) => {
    console.log(carrito)
    res.render('carrito', { carrito });
});



 //HAY QUE FORMAR EL OBJETO EN EL BODY DEL FETCH
 
app.listen(3000,() => {
    console.log("servidor escuchando puesto 3000")
})