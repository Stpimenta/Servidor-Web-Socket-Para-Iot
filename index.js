//--importando biblioteca---//
const { WebSocketServer } = require('ws');
require("dotenv").config();


//-objeto de usuarios que guarda as conexoes websocket-//
var Users = {}; 
const Port = process.env.SERVERPORT||3000 

//--instanciando ws---//
const wss = new WebSocketServer({port: Port});
console.log(`o servidor roda na porta ${Port}`);


//====Funções que serão usadas no codigo=======//
function Controller(client,data) { 
    try {
        const MessageJson = JSON.parse(data);//pega a mensagem e conver para Json  
        if(MessageJson.category && MessageJson.metodo){
            if(MessageJson.metodo.toLowerCase() == "read"){
                 //o objeto guarda categorias aqui ele verifica se a categoria do leitor ja existe
                if(!Users[MessageJson.category]){
                    Users[MessageJson.category] = [] //se n existir ele cria
                }
                // Verifique se o cliente já está registrado na categoria
                if (!Users[MessageJson.category].includes(client)) { //quando eu quero ver dentro do vetor/array uso includes, e verifico se esse cliente existe na categoria, a funcao retorna true se existir por isso uso !
                    Users[MessageJson.category].push(client); 
                    client.send(`cadastrado na categoria:${MessageJson.category}`);
                } else {
                    client.send("voce ja esta cadastrado nessa categoria");
                  }   
            }
            
           if(MessageJson.metodo.toLowerCase() == "publish" && MessageJson.mensagem){
              if(Users[MessageJson.category]){
                sendMessageToClients(MessageJson.category,MessageJson.mensagem,client, MessageJson.response)
              }else{
                 client.send("Verifique a conexão do seu dispositico, e a categoria cadastrada!");
               }
           } 

           if(MessageJson.metodo.toLowerCase() == "categorias"){
                client.send("categorias");
                for (const keys in Users){
                    client.send(keys);
                }
            } 

        }else{
            client.send("padrão errado, category e metodo são obrigatorios!");
          }
    } catch (error) {
        client.send("formato errado");
        console.log(error);
      }
}

// funcão para enviar mensagem a um cliente e receber uma de volta
function sendMessageToClients(category, message, clientpublish, publishresponse) {
    clientpublish.send("mensagem enviada")
    Users[category].forEach(async (client)=>{
       client.send(message);
       if(publishresponse == "true"){
            const response = new Promise ((resolve,reject)=>{
                client.on('message', function message(data) {
                    const returndata = JSON.parse(data)
                    if(/*returndata.metodo == "response" &&*/ returndata.mensagem){
                        resolve(returndata.mensagem);
                    }else{
                        reject("formato errado");
                    }
                    resolve(data); 
                })
                const timeout = setTimeout(()=>{
                    clearTimeout(timeout);
                    reject("mensagem de volta não recebida, verifique a conexão")
                },7000)
            })
            try {
                clientpublish.send(await response)
            } catch (error) {
                clientpublish.send(error)
            }
       }
    })
}




//--abre uma instancia de conexão do servidor---//
wss.on('connection', function connection(ws) {
    //mensagem que o cliente recebe quando se conecta
    ws.send('bem vindo sou um servidor para controlar vc, para se cadastrar me envie uma mensagem com as seguintes informaçoes e no padrão json: { --obrigatorios--"category": "//categoria que deseja participar",     "metodo": "//publish,read,response ou main"      ---caso publish adicione a mensagem "mensagem":      -------caso espere uma resposta (opcional) "response":true}');
    ws.on('message', function message(data) {
        Controller(ws,data);
    });
    //atribui isAlive para o objeto ws de forma que fique acessivel a todo escopo
    ws.isAlive = true;
    ws.on('pong',function(){
        ws.isAlive = true
    })
    //define um intervalo para os pings e mata clientes desconectados
    const interval = setInterval(()=>{
           if(ws.isAlive == false){
               ws.terminate();
               clearInterval(interval);
               //percorre todas as keys do objeto, category retorna cada categoria
               for(let category in Users){
                    let resultados = Users[category].filter((UsersArr)=> UsersArr != ws); //filter recebe cada elemento do array faz uma comparação e retorna um novo array
                    Users[category] = resultados

                    //verifica se o tamanho do array da categoria é zero para exluir
                    if(Users[category].length == 0){
                        delete Users[category]
                    }
               }
              
           }

           ws.ping();
           ws.isAlive=false;
    },1000)
});

