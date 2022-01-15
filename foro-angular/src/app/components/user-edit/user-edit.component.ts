import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params} from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import { global } from '../../services/global'


@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
  providers: [UserService]
})
export class UserEditComponent implements OnInit {

	public page_title: string;
	public user: User;
	public identity;
	public token;
	public status: string;
	public url;

	public afuConfig = {
		    multiple: false,
		    formatsAllowed: ".jpg, .png, .jpeg, .gif",
		    maxSize: "50",
		    uploadAPI:  {
		      	url: global.url + 'upload-avatar',
		      	method:"POST",
		      	headers: {				    
				    "Authorization" : this._userService.getToken()
		      	},		      			      	
		    },
		    theme: "attachPin",
		    hideProgressBar: false,
		    hideResetBtn: true,
		    hideSelectBtn: false,
		    replaceTexts: {
			    selectFileBtn: 'Select Files',
			    resetBtn: 'Reset',
			    uploadBtn: 'Upload',
			    dragNDropBox: 'Drag N Drop',
			    attachPinBtn: 'Sube tu imagen',
			    afterUploadMsg_success: 'Imgagen cargada correctamente',
			    afterUploadMsg_error: 'Se ha producido un error al subir la imagen',
			    sizeLimit: 'Size Limit'
		    }
		};
	
	public resetVar;


  	constructor(
  		private _router: Router,
  		private _route: ActivatedRoute,
  		private _userService : UserService
  	){ 
  		this.page_title = 'Ajustes de usuario';
  		this.identity = this._userService.getIdentity();
  		this.token = this._userService.getToken();
  		this.user = this.identity;
  		this.url = global.url;
  	}

	ngOnInit(): void {

	}

	onSubmit(form){
		this._userService.update(this.user).subscribe(
			response=>{
				if(!response.user){
					this.status = 'error';
				}else{
					this.status = 'success';
					localStorage.setItem('identity', JSON.stringify(this.user));
				}
			},
			error=>{
				this.status = 'error';
				console.log(error);
			}
		);
	}

	avatarUpload(datos){			
		console.log(datos);
		let data = JSON.parse(datos.response);	
		console.log(data);

		this.user.image = data.user.image;		
		console.log(this.user);
		
  	}

}
