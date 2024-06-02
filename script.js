// Ventana parametros
const tipo_funcion_select = document.querySelector("#tipo_funcion_select");
const cantidad_variables_input = document.querySelector("#cant_variables");
const cantidad_restricciones_input = document.querySelector("#cant_restricciones");
const ventana_parametros = document.querySelector(".ventana-principal-cantidades");

// Ventana restricciones - objetivo
const funcion_obj_input = document.querySelector("#funcion_obj");
const ventana_restricciones_objetivo =  document.querySelector(".ventana-funcion-restricciones");
ventana_restricciones_objetivo.style.display = 'none'; 

// Acciones
const boton_continuar = document.querySelector("#continuar-btn");

// Ventana resultados
const ventana_resultados = document.querySelector(".ventana-resultados");
const funcion_obj_final_titulo = document.querySelector("#funcion_obj_final");
ventana_resultados.style.display = 'none'; 


let ventana_actual = "params";

let tipo_funcion;
let cantidad_variables = 0;
let cantidad_restricciones = 0;

let funcion_objetivo = "";
let funcion_objetivo_final = "";
let restricciones = [];
let variables = [];
let coeficientesFuncion;
let constantes = [];
let matrizCoeficientes = [];

setVentanaIteracion();

boton_continuar.addEventListener("click", (event) => {
    console.log(event);
    switch (ventana_actual) {
        case "params":
            tipo_funcion =  parseInt(tipo_funcion_select.value);
            cantidad_variables = parseInt(cantidad_restricciones_input.value);
            cantidad_restricciones = parseInt(cantidad_restricciones_input.value);
            ocultarElemento(ventana_parametros);
            mostrarElemento(ventana_restricciones_objetivo);
            generarCamposRestricciones();
            ventana_actual = "restr_objetivo";
            break;
        case "restr_objetivo":
            funcion_objetivo = funcion_obj_input.value;
            for (let i = 1; i <= cantidad_restricciones; i++) {
                const restriccion = document.querySelector(`#restriccion_${i}`);
                restricciones.push(restriccion.value);
            }
            coeficientesFuncion = obtenerCoeficientes(funcion_objetivo);
            getFuncionObjetivoFinal();
            coeficientesFuncion = obtenerCoeficientes(funcion_objetivo_final);
            variables = obtenerVariables(funcion_objetivo_final);
            obtenerVectorConstantes();
            obtenerMatrizCoeficientes();
            console.log(coeficientesFuncion, funcion_objetivo_final, variables, constantes, matrizCoeficientes);
            setFuncionObjFinalLabel();
            ocultarElemento(ventana_restricciones_objetivo);
            mostrarElemento(ventana_resultados);
            setVentanaResultados();
            ventana_actual = "resultados";
            break;
        case "resultados":
            ventana_actual = "iteraciones";
        default:
            break;
    }
});

function setVentanaIteracion() {
    const vectorXb = document.querySelector(".vector-xb");
    const matriz = [
        [1, 0, 2, 0, 0],
        [0, 1, 3, 0, 0],
        [0, 0, 2, 1, 0],
        [2, 3, 1, 1, 1]
    ];
    const columnas = getIdentityMatrixColumns(matriz)
    console.log(columnas);
    // const columnasIdentidad = findIdentityMatrixColumns(matriz);
    //vectorXb.textContent = `[ ${columnasIdentidad.join(", ")} ]`;
}

function setVentanaResultados() {
    const vectorVariablesEl = document.querySelector(".vector-variables");
    vectorVariablesEl.textContent = `X = [ ${variables.join(", ")} ] `;

    const vectorCoeficientesEl = document.querySelector(".vector-coeficientes");
    const coeficientes = Object.values(coeficientesFuncion).join(", ");
    vectorCoeficientesEl.textContent = `C^t = [ ${coeficientes} ]`;

    const vectorConstantesEl = document.querySelector(".vector-constantes");
    vectorConstantesEl.textContent = `b = [ ${constantes.join(", ")} ]`;

    const matrizCoeficientesEl = document.querySelector(".matriz-coeficientes .matriz");
    for (let i = 0;  i < cantidad_restricciones; i++) {
        const fila = document.createElement("span");
        const elementos = matrizCoeficientes[i].join(", ");
        fila.textContent = `[ ${elementos} ]`;
        matrizCoeficientesEl.appendChild(fila);
    }
}

function setFuncionObjFinalLabel() {
    const tipoFuncion = tipo_funcion === 1 ? "Max" : "Min";
    const funcion = `${tipoFuncion} ${funcion_objetivo_final}`
    funcion_obj_final_titulo.textContent += funcion;
}

function obtenerMatrizCoeficientes() {
    for (let i = 0; i < cantidad_restricciones; i++) {
        matrizCoeficientes[i] = [];
        const restriccion = restricciones[i];
        let ecuacion = restriccion;
        if (restriccion.indexOf("<=") != -1) {
            ecuacion += ` + 1*s${i + 1}`;
        } else {
            if (restriccion.indexOf(">=") != -1) {
                ecuacion += ` - 1*s${i + 1}`;
            }
            ecuacion += ` + 1*u${i + 1}`;
        }

        let coeficientes = obtenerCoeficientes(ecuacion);

        for (let j = 0; j < variables.length; j++) {
            const coeficiente = coeficientes[variables[j]];
            coeficiente ? matrizCoeficientes[i].push(coeficiente) : matrizCoeficientes[i].push(0);
        }
    }
}

function obtenerVectorConstantes() {
    restricciones.forEach(restriccion => {
        // Elimina espacios en blanco
        restriccion = restriccion.replace(/\s+/g, '');

        // Define una expresión regular para encontrar comparadores (>=, <=, =)
        const comparadorRegex = /(>=|<=|=)(-?\d+(\.\d+)?)/;

        // Usa la expresión regular para encontrar el comparador y el valor
        const match = comparadorRegex.exec(restriccion);

        // Si se encuentra un match, devuelve el valor después del comparador
        if (match) {
            constantes.push(parseFloat(match[2]));
        }
    });
}

function obtenerVariables(equation) {
    // Elimina espacios en blanco
    equation = equation.replace(/\s+/g, '');
  
    // Define una expresión regular para encontrar variables específicas (x, s, u)
    const variableRegex = /([a-zA-Z]+\d*)/g;
  
    // Un conjunto para almacenar las variables únicas
    const variables = new Set();
  
    // Usa la expresión regular para encontrar todas las variables en la ecuación
    let match;
    while ((match = variableRegex.exec(equation)) !== null) {
      const variable = match[1];
  
      // Añade la variable al conjunto si empieza con x, s o u
      if (variable.startsWith('x') || variable.startsWith('s') || variable.startsWith('u')) {
        variables.add(variable);
      }
    }
    
    // Obtener variables para las restricciones con =
    for (let i = 0; i < cantidad_restricciones; i++) {
        const restriccion = restricciones[i];
        if (restriccion.indexOf(" = ") != -1) variables.add(`u${i + 1}`);
    }
  
    // Convierte el conjunto a un array y lo devuelve
    return Array.from(variables);
}

function obtenerCoeficientes(equation) {
    // Elimina espacios en blanco
    equation = equation.replace(/\s+/g, '');
  
    // Define una expresión regular para encontrar términos de la forma "coeficiente*variable"
    const termRegex = /([+-]?\d*\.?\d+)?\*?([a-zA-Z]+\d*)/g;
  
    // Un objeto para almacenar los coeficientes
    const coeficientes = {};
  
    // Usa la expresión regular para encontrar todos los términos en la ecuación
    let match;
    while ((match = termRegex.exec(equation)) !== null) {
      let coeficiente = match[1];
      const variable = match[2];
  
      // Si el coeficiente es nulo o vacío, significa que es 1 o -1
      if (coeficiente === '' || coeficiente === undefined) {
        coeficiente = equation[match.index - 1] === '-' ? -1 : 1;
      } else {
        coeficiente = parseFloat(coeficiente);
      }
  
      // Guarda el coeficiente en el objeto con la variable como clave
      coeficientes[variable] = coeficiente;
    }
  
    return coeficientes;
}

function getFuncionObjetivoFinal() {
    funcion_objetivo_final = funcion_objetivo;
    const valores = Object.values(coeficientesFuncion);
    const maximo = Math.max(...valores);
    const signoTipoFuncion = tipo_funcion === 1 ? "-" : "+"; // 1 Max(-) y 0 Min(+)
    for (let i = 0; i < cantidad_restricciones; i++) {
        const restriccion = restricciones[i];
        if (restriccion.indexOf("<=") != -1) {
            funcion_objetivo_final += ` + 0*s${i + 1}`;
        } else if (restriccion.indexOf(">=") != -1) {
            funcion_objetivo_final += ` + 0*s${i + 1} ${signoTipoFuncion} ${maximo*100}*u${i + 1}`;
        }
    }
}

function generarCamposRestricciones() {
    for (let i = 1; i <= cantidad_restricciones; i++) {
        const label = document.createElement("label");
        label.textContent = `Restricción #${i}`;
        ventana_restricciones_objetivo.appendChild(label);
        
        const input = document.createElement("input");
        input.id = `restriccion_${i}`;
        input.placeholder = `Ingrese la restricción`;
        ventana_restricciones_objetivo.appendChild(input);
    }
}

function ocultarElemento(elemento) {
    elemento.style.display = "none";
}

function mostrarElemento(elemento, displayMode = "flex") {
    elemento.style.display = displayMode;
}




