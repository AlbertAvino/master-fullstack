'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave-secreta-para-generar-el-token-9999';

exports.authenticated = function(req, res, next){
	// Comprovar si llega authorization
	if(!req.headers.authorization){
		return res.status(403).send({
			message: 'La petición no tiene la cabecera de authorization'
		});
	}

	// Limpiar el token y quitar comillas
	var token = req.headers.authorization.replace(/['"]+/g,'');
	
	// Decodificar el token
	try{
		var payload = jwt.decode(token, secret);
		// Comprovar la expiracion del token
		if(payload.exp <= moment().unix()){
		return res.status(404).send({
				message: 'El token ha expirado'
			});	
		}

	}catch(ex){
		return res.status(404).send({
			message: 'El token no es válido'
		});	
	}
	// Adjuntar usuario identificado a la request
	req.user = payload;

	// Pasar a la acción	
	next();
}