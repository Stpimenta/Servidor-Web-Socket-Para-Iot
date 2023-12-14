//--importando biblioteca---//
const { WebSocketServer } = require('ws');
require("dotenv").config();

//definindo a porta com variaveis de ambiente
const Port = process.env.SERVERPORT||3000 //caso n de para executar na 4000 o server vai para 3000
//--instanciando ws---//
const wss = new WebSocketServer({port: Port});
console.log(`o servidor roda na porta ${Port}`);

//-variavel que cuida dos usuarios-//
var Users = {}; //cada usuario e guardado nesse objeto

//--metodos do servidor websocket como connect, receber mensagem, erro e conexao fechada--//
wss.on('connection', function connection(ws) {
    //atribui isAlive para ws de forma que fique acessivel a todo escopo
    //isso e um controle para ver se o client ainda esta conectado, ele pinga e espera uma resposta
    ws.isAlive = true;
        ws.on('pong',function(){
            ws.isAlive = true
        })

        const interval = setInterval(()=>{
            if(ws.isAlive == false){
                for (let category in Users) {
                    Users[category] = Users[category].filter(client => client !== ws);
                    
                }

                console.log("usuario removido");
                ws.close();
                ws.terminate();
                ws.isAlive = true
                clearInterval(interval);
            }
            ws.ping();
            ws.isAlive=false;
        },15000)
   
    ws.send('bem vindo sou um servidor para controlar vc, para se cadastrar me envie uma mensagem com as seguintes informaçoes e no padrão json: { "category": "//categoria que deseja participar",     "metodo": "//publish ou read",     "mensagem": "//caso publish mensagem a ser enviada, se for read escreve algo n deixa nulo" }');
    ws.on('message', function message(data) {
        

        console.log('received: %s', data);

        //receber a mensagem e tratar ver se esta no foramto json
        let json = ""
        try{
             json = JSON.parse(data);
        }catch(e){
            console.log("ta errado essa merda");
        }

        if(validJson(json)){
           console.log(json.metodo);
           //metodo do usuario se ele e leitor ou publica
            if(json.metodo == "read" ){
                //o objeto guarda categorias aqui ele verifica se a categoria do leitor ja existe
                if(!Users[json.category]){
                    Users[json.category] = [] //se n existir ele cria
                }
              // Verifique se o cliente já está registrado na categoria
                if (!Users[json.category].includes(ws)) { //quando eu quero ver dentro do vetor/array uso includes, e verifico se esse cliente existe na categoria, a funcao retorna true se existir por isso uso !
                    Users[json.category].push(ws); 
                    ws.send(`cadastrado na categoria:${json.category}`);
                } else {
                    ws.send("sem duplicata");
                }
            }

            if(json.metodo == "publish" ){ //se especificar que é um publish 
                
                if(Users[json.category]){
                    ws.send("mensagem enviada");
                  sendMessageToClients(json.category,json.mensagem);
                }else{
                    ws.send("categoria para publish invalida");
                }
                
            }
          
        }else{ // foramto errado
            console.log("formato errado");
            ws.send("formato errado animal");
        }
        
    });

    ws.on('close', function() { //cliente desconectado
        console.log('Cliente desconectado');
        // Encontre a categoria do cliente desconectado
        for (let category in Users) {
            Users[category] = Users[category].filter(client => client !== ws);
            
        }
    });


    
   
});

//fucao para validar o formato
function validJson(json) { 
    if (!json.category||!json.metodo||!json.mensagem) {
        return false;
    }
    return true;
}

function sendMessageToClients(category, message) {
    Users[category].forEach((client)=>{ //foreach percorre todos os elementos de um array no caso o array da categoria informada e realiza uma acao no casso enviar a mensagem, client e cada objeto que esta sendo analisado pelo foreach.
         client.send(message);
    });
}
