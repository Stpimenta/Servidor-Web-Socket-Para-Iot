instalar as dependencias
### yarn add i

yarn start/yarn dev iniciam, dev esta com nodemon
### yarn start

### em env example tem as variaveis de ambiente a serem preenchidas
### no Arduino utilize a biblioteca ArduinoSockets, responde muito bem e funcinou perfeitamente em esp32 e esp01



### para interagir estes sao os metodos

### publicacao com resposta

{"category": "user", 
 "metod":"publish",
 "menssage":"f", 
 "response":"true"
}

### publicacao com resposta

{"category": "user", 
 "metod":"publish",
 "menssage":"f", 
 "response":"true"
}

### cadastro

{"category": "user", 
 "metod":"read"
}


### metodo para obter uma lista de cadastrados

{    
"metod": "categorias"
}

### caso estiver publicando e quer acessar mais de um dispositivo utilize '-' entre os comandos 

{"category": "esp01_luz_banheiro_descanso-esp01_power_pc", 
 "metod":"publish",
 "menssage":"o-o", 
 "response":"true-true"
}


//--------O projeto esta em sua fase inicial e irei continuar desenvolvendo essa ideia.-----//
//--------A ideia é fazer um protocolo mqtt com mais funcoes para o contexto de automação residencial.-----//






