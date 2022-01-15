'user strict'

var validator = require('validator');
var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var fs = require('fs');
var path = require('path');

var controller = {

	probando: function(req, res){
		return res.status(200).send({
			message: "Soy el metodo PROVANDO"
		});
	},
	testeando: function(req, res){
		return res.status(200).send({
			message: "Soy el metodo TESTEANDO"
		});},

	save: function (req, res){
		// Recoger los parametros de la petición
		var params = req.body;
		try{
			// Validar los datos
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname =  !validator.isEmpty(params.surname);
			var validate_email =  validator.isEmail(params.email) && !validator.isEmpty(params.email);
			var validate_password = !validator.isEmpty(params.password);

		}catch(er){
			return res.status(200).send({
				message: "Faltan datos para enviar",
				params				
			});
		}
		
		//console.log(validate_name, validate_surname, validate_email, validate_password);
		if (validate_name && validate_surname && validate_email && validate_password){
			// Crear objeto de usuario
			var user = new User();
			// Asignar valores al usuario
			user.name = params.name;
			user.surname = params.surname;
			user.email = params.email.toLowerCase();
			user.role = 'ROLE_USER';
			user.image = null;

			// comprovar si el usuario existe
			User.findOne({email: user.email}, (err, issetUser) => {
				if(err) {
					return res.status(500).send({
						message: "Error al comprobar duplicidad de usuario"
					});
				}
				if(!issetUser){
					// Si no existe cifrar password
					bcrypt.hash(params.password, null, null, (err, hash) => {
						user.password = hash;
						// guardar usuario
						user.save((err, userStored) => {
							if(err) {
								return res.status(500).send({
									message: "Error al guardar el usuario"
								});
							}

							if(!userStored){
								return res.status(400).send({
									message: "Error usuario no se ha guardado"
								});	
							}
							// devolver respuesta
							return res.status(200).send({
								status: 'success',
								user :userStored 
							});
						}); // close save
					}); // close bcrypt
					
				}else{
					return res.status(200).send({
							message: "El usuario ya está registrado"
						});
				}
			});

		} else {
			return res.status(200).send({
				message: "La validación de los datos del usuario incorrecta, intentalo de nuevo"
			});
		}

	},

	login:function (req, res) {
		// recoger los parametros de la peticion
		var params = req.body;
		try{
			// validar los datos
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
			var validate_password = !validator.isEmpty(params.password);
		}catch(er){
			return res.status(200).send({
				message: "Faltan datos para enviar",
				params				
			});
		}
		

		if(!validate_email || !validate_password){
			return res.status(200).send({
				message: "Los datos son incorrectos, envialos bien"
			});
		}

		// buscar usuarios que coincidan con el email que nos llega
		User.findOne({email: params.email.toLowerCase()}, (err, user) => {
			if(err){
				return res.status(500).send({
					message: "Error al intentar identificarse"
				});	
			}

			if(!user){
				return res.status(404).send({
				message: "El usuario no existe"
				
				});
			}
			// si lo encuentra, comprobar contraseña(coincidencia de email y password / bcrypt)
			bcrypt.compare(params.password, user.password, (err, check) =>{
				if (check){
					// generar token de jwt y devolverlo
					if(params.gettoken){
						return res.status(200).send({							
							token: jwt.createToken(user)
						});	
					}else{
						// limpiar el objeto
						user.password = undefined;
						// si las credenciales coinciden devolveremos los datos
						return res.status(200).send({
							message: "success",
							user
						});
					}
					
				}else{
					return res.status(200).send({
						message: "Las credenciales no son correctas"
					});
				}

			});

			
		});
	},

	update: function (req, res){
		// Recojer los datos del usuario
		var params = req.body;

		try{
			// Validar datos
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname =  !validator.isEmpty(params.surname);
			var validate_email =  validator.isEmail(params.email) && !validator.isEmpty(params.email);
		}catch(er){
			return res.status(200).send({
				message: "Faltan datos para enviar",
				params				
			});
		}
		// Eliminar propiedades innecesarias
		delete params.password;		

		var userId = req.user.sub;
		// Comprobar si el mail es unico
		if(req.user.email != params.email){			
			User.findOne({email: params.email.toLowerCase()}, (err, user) => {
				if(err){					
					return res.status(500).send({
						message: "Error al intentar actualizar"
					});	
				}

				if(user && user.email == params.email){
					return res.status(200).send({
						message: "El email no puede ser modificado"					
					});
				}else{
					// Buscar y actualizar documento
					// User.findOneAndUpdate(condicion, datos a actualizar, opciones, callback)
					User.findOneAndUpdate({_id: userId}, params, {new: true},(err, userUpdated) => {
						
						if(err){
							return res.status(500).send({
								status: 'error',
								message: 'Error al actualizar el usuario'

							});					
						}
						if(!userUpdated){
							return res.status(500).send({
								status: 'error',
								message: 'Error al actualizar el usuario'

							});					
						}
						return res.status(200).send({
							status: 'success',
							user: userUpdated

						});	
					});	
				}
			});
		}else{
			// Buscar y actualizar documento
			// User.findOneAndUpdate(condicion, datos a actualizar, opciones, callback)
			User.findOneAndUpdate({_id: userId}, params, {new: true},(err, userUpdated) => {
				
				if(err){
					return res.status(500).send({
						status: 'error',
						message: 'Error al actualizar el usuario'

					});					
				}
				if(!userUpdated){
					return res.status(500).send({
						status: 'error',
						message: 'Error al actualizar el usuario'

					});					
				}
				return res.status(200).send({
					status: 'success',
					user: userUpdated

				});	
			});
		}
	},

	uploadAvatar: function (req, res){
		// recoger el fichero de la peticion
		var file_name = 'Avatar no subido...';

		if(!req.files){
			return res.status(404).send({
				status: 'error',
				message: file_name
			});
		}

		// conseguir el nombre y la extension del archivo
		var file_path = req.files.file0.path;
		var file_split = file_path.split('\\');
		// **Advertencia** en linux o mac
		// var file_split = file_path.split('/');

		// nom de la arxiu
		var file_name = file_split[2];
		// extensio del arxiu
		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];
		// comprovar la extension(solo imagenes)
		if(file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' && file_ext != 'gif'){
			fs.unlink(file_path, (err) => {
				return res.status(200).send({
					status: 'error',
					message: 'La extension del arxivo no es valida'
				});
			});
		}else{

			// sacar el id del usuario identificado
			var userId = req.user.sub;

			// buscar y actualizar documento
			User.findOneAndUpdate({_id: userId} , {image: file_name}, {new: true}, (err, userUpdated) =>{				
				if(err || !userUpdated){
					return res.status(500).send({
						status: 'error',
						message: 'Error al subir la imagen'						
					});				
				}
				// devolver respuesta
				return res.status(200).send({	
					message: 'success',
					user: userUpdated
				});			
			});
			
		}

	},

	avatar: function (req, res){
		var fileName = req.params.fileName;
		var pathFile = './uploads/users/' + fileName;

		fs.exists(pathFile, (exists) => {
			if (exists){
				return res.sendFile(path.resolve(pathFile));
			}else{
				return res.status(404).send({
					message: 'La imagen no exite'
				});
			}
		});

	},
	getUsers:function(req, res){
		User.find().exec((err,users)=>{
			if(err || !users){
				return res.status(404).send({
					status: 'error',
					message: 'No hay usuarios que mostrar'
				});
			}

			return res.status(200).send({
				status: 'success',
				users
			});
		});
	},
	getUser:function (req, res){
		var userId = req.params.userId;

		User.findById(userId).exec((err, user)=>{
			if(err || !user){
				return res.status(404).send({
					status: 'error',
					message: 'No exite el usuario'
				});
			}

			return res.status(200).send({
				status: 'success',
				user
			});
		});
	}

};

module.exports = controller;
