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
const mensaje_fin = document.querySelector(".mensaje-fin");
mensaje_fin.style.display = "none";

// Ventana resultados
const ventana_resultados = document.querySelector(".ventana-resultados");
const funcion_obj_final_titulo = document.querySelector("#funcion_obj_final");
ventana_resultados.style.display = 'none'; 

// Ventana iteraciones
const ventana_iteraciones = document.querySelector(".ventana-iteraciones");
ventana_iteraciones.style.display = 'none';

let ventana_actual = "params";
let iteracion_actual = 1;

let tipo_funcion;
let cantidad_variables = 0;
let cantidad_restricciones = 0;

let funcion_objetivo = "";
let funcion_objetivo_final = "";
let funcion_objetivo_final_display = "";
let restricciones = [];
let variables = [];
let coeficientesFuncion;
let constantes = [];
let matrizCoeficientes = [];
let Xb = [];

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
            ocultarElemento(ventana_resultados);
            mostrarElemento(ventana_iteraciones);
            
            setVentanaIteracion();
            ventana_actual = "iteraciones";
            break;
        case "iteraciones":
            limpiarMatrices();
            iteracion_actual++;
            setVentanaIteracion();
            break;
    }
});

function limpiarMatrices() {
    const ElMatrizB = document.querySelector(".matriz-b .matriz");
    while (ElMatrizB.firstChild) {
        ElMatrizB.removeChild(ElMatrizB.lastChild);
    }

    const bInversaEl = document.querySelector(".matriz-b-1 .matriz");
    while (bInversaEl.firstChild) {
        bInversaEl.removeChild(bInversaEl.lastChild);
    }

    const bInversaAEl = document.querySelector(".matriz-b-1a .matriz");
    while (bInversaAEl.firstChild) {
        bInversaAEl.removeChild(bInversaAEl.lastChild);
    }
}

function setVentanaIteracion() {
    const tituloIteracion = document.querySelector("#titulo-iteracion");
    tituloIteracion.textContent = `Iteración ${iteracion_actual}`;
    const vectorXb = document.querySelector(".vector-xb");
    let posiciones = [], columnas = [];
    if (!Xb.length) {
        const resp = getMatrizIdentidad(matrizCoeficientes);
        posiciones = resp.posiciones;
        columnas = resp.columnas;
        Xb = posiciones.map(pos => variables[pos]);
    } else {
        Xb.forEach(element => {
            posiciones.push(variables.indexOf(element));
        });
        posiciones.forEach(pos => {
            let columna = [];
            for (let i = 0; i < matrizCoeficientes.length; i++) {
                columna.push(matrizCoeficientes[i][pos]);
            }
            columnas.push(columna);
        });
    }
    console.log(posiciones, columnas);
    vectorXb.textContent = `[ ${Xb.join(", ")} ]`;

    const ElMatrizB = document.querySelector(".matriz-b .matriz");
    let matrizB = [];
    const rows = columnas.length;
    const cols = columnas[0].length;
    for (let i = 0; i < cols; i++) {
        let fila = [];
        for (let j = 0; j < rows; j++) {
            fila.push(columnas[j][i]);
        }
        matrizB.push(fila);
    }
    for (let i = 0; i < matrizB.length; i++) {
        const fila = document.createElement("span");
        const elementos = matrizB[i].join(", ");
        fila.textContent = `[ ${elementos} ]`;
        ElMatrizB.appendChild(fila);
    }

    const CtbEl = document.querySelector(".vector-ct");
    const coeficientes = Object.values(coeficientesFuncion);
    console.log(coeficientes);
    const ctb = posiciones.map(pos => coeficientes[pos]);
    CtbEl.textContent = `[ ${ctb.join(", ")} ]`;

    const bInversaEl = document.querySelector(".matriz-b-1 .matriz");
    const bInversa = math.inv(matrizB); 
    for (let i = 0; i < bInversa.length; i++) {
        const fila = document.createElement("span");
        fila.textContent += "[ ";
        let valores = [];
        for (let j = 0; j < bInversa[0].length; j++) {
            const valor = bInversa[i][j] % 1 != 0 
                ? Number(bInversa[i][j]).toFixed(2) 
                : bInversa[i][j];
            valores.push(valor);
        }
        fila.textContent += valores.join(", ") + " ]";
        bInversaEl.appendChild(fila);
    }

    const bInversaAEl = document.querySelector(".matriz-b-1a .matriz");
    const bInversaA = multiplicarMatrices(bInversa, matrizCoeficientes);
    for (let i = 0; i < bInversaA.length; i++) {
        const fila = document.createElement("span");
        fila.textContent += "[ ";
        let valores = [];
        for (let j = 0; j < bInversaA[0].length; j++) {
            const valor = bInversaA[i][j] % 1 != 0 
                ? Number(bInversaA[i][j]).toFixed(2) 
                : bInversaA[i][j];
            valores.push(valor);
        }
        fila.textContent += valores.join(", ") + " ]";
        bInversaAEl.appendChild(fila);
    }

    const ctbaEl = document.querySelector(".vector-ctb");
    const ctba = vectorPorMatriz(ctb, bInversaA);
    let valores = [];
    for (let i = 0; i < ctba.length; i++) {
        const valor = ctba[i] % 1 != 0 
            ? Number(ctba[i]).toFixed(2) 
            : ctba[i];
        valores.push(valor);
    }
    ctbaEl.textContent = `[ ${valores.join(", ")} ]`;

    const rEl = document.querySelector(".vector-r");
    const r = restaVector(ctba, Object.values(coeficientesFuncion));
    valores = [];
    for (let i = 0; i < r.length; i++) {
        const valor = r[i] % 1 != 0 
            ? Number(r[i]).toFixed(2) 
            : r[i];
        valores.push(valor);
    }
    rEl.textContent = `[ ${valores.join(", ")} ]`;

    const tetaEl = document.querySelector(".vector-teta");
    console.log(bInversa, constantes);
    const bInversaB = matrizPorVector(bInversa, constantes);
    console.log(bInversaB);
    const valorEntra = r.indexOf(Math.min(...r));
    let columna = [];
    for (let i = 0; i < bInversaA.length; i++) {
        columna.push(bInversaA[i][valorEntra]);
    }
    const teta = dividirVector(bInversaB, columna);
    valores = [];
    for (let i = 0; i < teta.length; i++) {
        const valor = teta[i] % 1 != 0 
            ? Number(teta[i]).toFixed(2) 
            : teta[i];
        valores.push(valor);
    }
    tetaEl.textContent = `[ ${valores.join(", ")} ]`;

    const zEl = document.querySelector(".vector-z");
    let z = vectorPorMatriz(ctb, bInversa);
    z = multiplicarVector(z, constantes);
    valores = [];
    for (let i = 0; i < z.length; i++) {
        const valor = z[i] % 1 != 0 
            ? Number(z[i]).toFixed(2) 
            : z[i];
        valores.push(valor);
    }
    zEl.textContent = `[ ${valores.join(", ")} ]`;

    let minTeta = Math.max(...teta);
    for (let i = 0; i < teta.length ; i++) {
        if (teta[i] != null && teta[i] < minTeta) {
            minTeta = teta[i];
        }
    }
    const valorSale = teta.indexOf(minTeta);
    setToast(variables[valorEntra], Xb[valorSale], bInversaB);
    Xb[valorSale] = variables[valorEntra];
    validarFinIteraciones(r);
}

function setToast(valorEntra, valorSale, bInversaB) {
    
    const toastEl = document.querySelector(".toast");
    const valorEntraEl = document.querySelector(".toast .valor-entra");
    const valorSaleEl = document.querySelector(".toast .valor-sale");
    const b1b = document.querySelector(".vector-b-1-b");

    b1b.textContent = `(B^-1)b = [ ${bInversaB.join(", ")} ]`;
    toastEl.style.display = "flex";
    valorEntraEl.textContent = `Valor entra: ${valorEntra}`;
    valorSaleEl.textContent = `Valor sale: ${valorSale}`;
}

function validarFinIteraciones(vector) {
    const toastEl = document.querySelector(".toast");
    const valido = vector.every(v => v >= 0);
    if (valido) {
        boton_continuar.style.display = "none";
        mensaje_fin.style.display = "initial";
        toastEl.style.display = "none";
    }
}

function dividirVector(vector1, vector2) {
    let resultado = [];
    for (let i = 0; i < vector1.length; i++) {
        const valor = vector1[i] / vector2[i];
        resultado.push(valor >= 0 ? valor : null);
    }
    return resultado;
}

function multiplicarVector(vector1, vector2) {
    let resultado = [];
    for (let i = 0; i < vector1.length; i++) {
        resultado.push(vector1[i] * vector2[i]);
    }
    return resultado;
}

function restaVector(vector1, vector2) {
    let resultado = [];
    for (let i = 0; i < vector1.length; i++) {
        resultado.push(vector1[i] - vector2[i]);
    }
    return resultado;
}

function vectorPorMatriz(vector, matriz) {
    // Comprobamos que el número de elementos del vector coincida con el número de filas de la matriz
    if (vector.length !== matriz.length) {
      throw new Error("El número de elementos del vector debe coincidir con el número de filas de la matriz");
    }
  
    // Inicializamos el vector resultado
    let resultado = new Array(matriz[0].length).fill(0);
  
    // Realizamos la multiplicación
    for (let j = 0; j < matriz[0].length; j++) {
      for (let i = 0; i < vector.length; i++) {
        resultado[j] += vector[i] * matriz[i][j];
      }
    }
  
    return resultado;
}

function matrizPorVector(matriz, vector) {
    // Comprobamos que el número de columnas de la matriz coincida con el tamaño del vector
    if (matriz[0].length !== vector.length) {
      throw new Error("El número de columnas de la matriz debe coincidir con el tamaño del vector");
    }
  
    // Inicializamos el vector resultado
    let resultado = new Array(matriz.length).fill(0);
  
    // Realizamos la multiplicación
    for (let i = 0; i < matriz.length; i++) {
      for (let j = 0; j < vector.length; j++) {
        resultado[i] += matriz[i][j] * vector[j];
      }
    }
  
    return resultado;
}

function multiplicarMatrices(matrizA, matrizB) {
    const filasA = matrizA.length;
    const columnasA = matrizA[0].length;
    const filasB = matrizB.length;
    const columnasB = matrizB[0].length;
  
    // Verificar que las matrices se pueden multiplicar
    if (columnasA !== filasB) {
      throw new Error("El número de columnas de la primera matriz debe ser igual al número de filas de la segunda matriz.");
    }
  
    // Crear la matriz resultado con ceros
    const resultado = Array(filasA).fill().map(() => Array(columnasB).fill(0));
  
    // Realizar la multiplicación de matrices
    for (let i = 0; i < filasA; i++) {
      for (let j = 0; j < columnasB; j++) {
        for (let k = 0; k < columnasA; k++) {
          resultado[i][j] += matrizA[i][k] * matrizB[k][j];
        }
      }
    }
  
    return resultado;
  }

function getMatrizIdentidad(matriz) {
    let posiciones = [];
    let columnas = [];
    const rows = matriz.length;
    const cols = matriz[0].length;

    for (let i = 0; i < cols; i++) {
        let columna = [];
        for (let j = 0; j < rows; j++) {
            columna.push(matriz[j][i]);
        }
        if (getColumnaIdentidad(columna)) {
            posiciones.push(i);
            columnas.push(columna);
        }
    }
    return {posiciones, columnas}
}

function getColumnaIdentidad(columna) {
    // Filtra los elementos que son iguales a 1
    const unos = columna.filter(element => element === 1);

    // Verifica que hay exactamente un 1 y que todos los otros elementos son 0
    const esValido = unos.length === 1 && columna.every(element => element === 0 || element === 1);

    return esValido;
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
    const funcion = `${tipoFuncion} ${funcion_objetivo_final_display}`;
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

function obtenerCoeficientesFinales(equation) {
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

    // Obtener variables para las restricciones con =
    for (let i = 0; i < cantidad_restricciones; i++) {
        const restriccion = restricciones[i];
        if (restriccion.indexOf(" = ") != -1) {
            coeficientes[`u${i}`] = 0;
        };
    }
  
    return coeficientes;
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
    funcion_objetivo_final = funcion_objetivo_final_display = funcion_objetivo;
    const valores = Object.values(coeficientesFuncion);
    const maximo = Math.max(...valores);
    // const signoTipoFuncion = tipo_funcion === 1 ? "-" : "+"; // 1 Max(-) y 0 Min(+)
    for (let i = 0; i < cantidad_restricciones; i++) {
        const restriccion = restricciones[i];
        if (restriccion.indexOf("<=") != -1) {
            funcion_objetivo_final += ` + 0*s${i + 1}`;
            funcion_objetivo_final_display += ` + 0*s${i + 1}`;
        } else if (restriccion.indexOf(">=") != -1) {
            funcion_objetivo_final += ` + 0*s${i + 1} - ${maximo*100}*u${i + 1}`;
            funcion_objetivo_final_display += ` + 0*s${i + 1} - ${maximo*100}*u${i + 1}`;
        } else {
            funcion_objetivo_final += ` + 0*u${i + 1}`;
        }
    }
    
    if (tipo_funcion === 0) {
        funcion_objetivo_final = multiplicarEcuacionPorMenosUno(funcion_objetivo_final);
        funcion_objetivo_final_display = multiplicarEcuacionPorMenosUno(funcion_objetivo_final_display);
    }
}

function multiplicarEcuacionPorMenosUno(equation) {
    // Elimina espacios en blanco
    equation = equation.replace(/\s+/g, '');
  
    // Define una expresión regular para encontrar términos de la forma "coeficiente*variable" o números sueltos
    const termRegex = /([+-]?)(\d*\.?\d+|\d+)(\*[a-zA-Z]+\d*)?/g;
  
    let result = equation.replace(termRegex, (match, sign, coeficiente, variable) => {
        // Cambia el signo del coeficiente
        if (sign === '-') {
            sign = '+';
        } else {
            sign = '-';
        }
        // Maneja casos donde la variable puede ser undefined
        return `${sign}${coeficiente}${variable || ''}`;
    });

    // Quitar el signo "+" al inicio si existe
    if (result[0] === '+') {
        result = result.substring(1);
    }

    // Agregar espacios entre los términos
    result = result.replace(/([+-])/g, ' $1 ').trim();
  
    return result;
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