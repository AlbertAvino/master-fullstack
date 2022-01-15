'use strict'

var validator = require('validator');
var Topic = require('../models/topic');


var controller = {

	test: function(req, res){
		return res.status(200).send({
			message: 'hola que tal'
		})
	},
	save:function(req, res){
		// recoger parametros por post
		var params = req.body;

		// validar los datos
		try{
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);		
			var validate_lang = !validator.isEmpty(params.lang);


		}catch(err){
			return res.status(200).send({
				message: 'Faltan datos por enviar'
			});
		}

		if (validate_content && validate_title && validate_lang){
			// crear objeto a guardar
			var topic = new Topic();
			// assignar valores a las propiedades
			topic.title = params.title;
			topic.content = params.content;
			topic.code = params.code;
			topic.lang = params.lang;
			topic.user = req.user.sub;

			// guardar el topic 
			topic.save((err, topicStored)=>{

				if(err ||  !topicStored){
					return res.status(404).send({
						status: 'error',
						message: 'El tema no se ha guardado'
					});
				}
				// devolver respuesta
				return res.status(200).send({
					status: 'success',
					topic: topicStored
				});
			});

			
		}else {
			return res.status(200).send({
				message: 'Los datos no son válidos'
			});
		}
		
	},
	getTopics: function (req, res){
		// recoger la pagina actual
		if ( !req.params.page || 
			  req.params.page == 0 || 
			  req.params.page == '0' || 
			  req.params.page == undefined){
			var page = 1; 

		}else{
			var page = parseInt(req.params.page);	
		}		

		// indicar las opciones de paginacion
		var options = {
		  sort:     { date: -1 },
		  populate: 'user',
		  limit:    5,
		  page: page
		  
		};

		// find paginado
		Topic.paginate({}, options, (err, topics)=>{
			
			if(err){
				return res.status(500).send({
					status: 'error', 
					message: 'Error al hacer la consulta'
					
				});	
			}

			if(!topics){
				return res.status(404).send({
					status: 'error', 
					message: 'No hay topics'
					
				});		
			}

			// devolver el resultado ( topics, total de topics, total de paginas)
			return res.status(200).send({
				status: 'success', 
				topics: topics.docs,
				totalDocs: topics.totalDocs, 
				totalPages: topics.totalPages
				
			});


		});

	},

	getTopicsByUser: function (req, res){
		// conseguir el id del usuario
		var userId = req.params.user;
		// hacer un find con la condicion de usuario

		Topic.find({ user: userId})
			 .sort([['date','descending']])
			 .exec((err, topics) =>{
			 	if(err){
			 		// devolver un resultado		
					return res.status(500).send({
						status: 'error',
						message: 'Error en la peticion'
					});
			 	}
			 	if(!topics){
			 		// devolver un resultado		
					return res.status(404).send({
						status: 'error',
						message: 'No hay temas para mostrar'
					});
			 	}
			 	// devolver un resultado		
				return res.status(200).send({
					status: 'success',
					topics
				});
			 });
		
	},
	getTopic: function (req,res){
		//obtenir el id del topic de la URL
		var topicId = req.params.id;

		//fin per id del topic
		Topic.findById(topicId)
			 .populate('user')
			 .populate('comments.user')
			 .exec((err,topic)=>{
			 	if(err){
				 	return res.status(500).send({
						status: 'error',
						message: 'Error en la petición'
					});	
			 	}

			 	if(!topic){
			 		return res.status(404).send({
						status: 'error',
						message: 'No se ha encontrado el tema'
					});	
			 	}


				// devolver un resultado		
				return res.status(200).send({
					status: 'success',
					topic
				});

			 });

	},

	update: function (req, res){
		// obtener el id del topic
		var topicId = req.params.id;
		// recoger los datos que llegan del post
		var params = req.body;
		// validar datos
		try{
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);		
			var validate_lang = !validator.isEmpty(params.lang);
		}catch(err){
			return res.status(200).send({
				message: 'Faltan datos por enviar'
			});
		}

		if(validate_title && validate_content && validate_lang){
			// montar un json con los datos modificables
			var update = {
				title: params.title,
				content: params.content,
				code: params.code,
				lang: params.lang
			}
			// findandupdate del topic por id y por id de usuario
			Topic.findOneAndUpdate({_id: topicId, user: req.user.sub}, update, {new: true}, (err,topicUpdated)=>{
				if(err){
					return res.status(500).send({
						status: 'error',
						message: 'Error en la petición'
					});
				}
				if(!topicUpdated){
					return res.status(404).send({
						status: 'error',
						message: 'No se ha actualizado el tema'
					});
				}

				// devolver la respuesta
				return res.status(200).send({
						status: 'success',
						topic: topicUpdated
					});
			});

			
		}else{
			return res.status(200).send({message: 'La validacion de los datos no es correcta'})
		}

	},
	delete: function (req, res){
		// sacar el id del topic de la url
		var topicId = req.params.id;
		// findAndDelete por topicid y userid
		Topic.findOneAndDelete({_id :topicId, user : req.user.sub}, (err, topicRemoved) =>{
			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'Error en la petición'
				});
			}
			if(!topicRemoved){
				return res.status(404).send({
					status: 'error',
					message: 'No se ha borrado el tema'
				});
			}

			// devolver respuesta
			return res.status(200).send({
				status: 'success' ,
				topicRemoved}
			);
		});
		
	},
	search: function(req, res){
		// Sacar el string a buscar de la url
		var searchString = req.params.search;
		// find or
		Topic.find({
					"$or" : [
						{"title": {"$regex" : searchString, "$options":"i" } },
						{"content": {"$regex" : searchString, "$options":"i" } },
						{"code": {"$regex" : searchString, "$options":"i" } },
						{"lang": {"$regex" : searchString, "$options":"i" } }
					]
					})
			.populate('user')
			.sort([['date','descending']])
			.exec((err,topics)=>{
				if(err){
					return res.status(500).send({
						status: 'error',
						message: 'Error en la petición'
					});
				}
				if(!topics){
					return res.status(404).send({
						status: 'error',
						message: 'No hay temas disponibles'
					});
				}

				return res.status(200).send({
						status: 'success',
						topics
					});

			});		
	}


};

module.exports = controller;