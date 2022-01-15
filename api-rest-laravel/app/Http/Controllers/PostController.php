<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

use App\Post;
use App\Helpers\JwtAuth;

class PostController extends Controller
{
    public function __construct(){
        $this->middleware('api.auth', ['except' => ['index',
                                                    'show',
                                                    'getImage',
                                                    'getPostsByCategory',
                                                    'getPostsByUser']]);
    }
    
    public function index(){
        $posts = Post::all()->load('category');
        
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'posts' => $posts
        ],200);
    }
    
    public function show($id){
        $post = Post::find($id)->load('category')
                               ->load('user');
        
        if(is_object($post)){
            $data = [
                'code' => 200,
                'status' => 'success',
                'posts' => $post];
        }else{
            $data = [
                'code' => 404,
                'status' => 'error',
                'posts' => 'La entrada no existe'];
        }
        
        return response()->json($data,$data['code']);
    }
    
    public function store(Request $request){
        // Recollir les dades per post
        $json = $request->input('json', null);
        $params = json_decode($json);
        $params_array = json_decode($json,true);
        
        if (!empty($params_array)){
            // sonseguir el usuario identificado
            $user = $this->getIdentity($request);
            
            // validar les dades
            $validate = \Validator::make($params_array ,[
                'title'  => 'required',
                'content'  => 'required',
                'category_id'  => 'required',
                'image'  => 'required'
            ]);
            if ($validate->fails()){
                $data = [
                    'code' => 400,
                    'status' => 'error',
                    'message' => 'No se ha guardado el post, faltan datos'
                ];
            }else{
                $post = new Post();
                $post->user_id = $user->sub;
                $post->category_id = $params->category_id;
                $post->title = $params->title;
                $post->content = $params->content;
                $post->image = $params->image;
                
                $post->save();
                
                
                $data = [
                    'code' => 200,
                    'status' => 'success',
                    'post' => $post
                ];
            }
            // guardar el post
        }else{
            $data = [
                    'code' => 400,
                    'status' => 'error',
                    'message' => 'Envia los datos correctamente'
                ];
        }
        // retornar la resposta
        return response()->json($data,$data['code']);
    }
    
    public function update($id, Request $request){
        // recullir les dades del post
        $json = $request->input('json', null);
        $params_array = json_decode($json, true);
        // datos para devolver
        $data = array(
                'code' => 400,
                'status' => 'error',
                'post' => 'Datos enviados incorrectamente'
            );
        
        
        if(!empty($params_array)){
            // validar les dades
            $validate = \Validator::make($params_array ,[
                        'title'  => 'required',
                        'content'  => 'required',
                        'category_id'  => 'required'
                ]);
            if ($validate->fails())    {
                $data['errors'] = $validate->errors();
                return response()->json($data, $data['code']);
            }
            //eliminar el que no es vol actualitzar
            unset($params_array['id']);
            unset($params_array['user_id']);
            unset($params_array['created_at']);
            unset($params_array['user']);
            // sonseguir el usuario identificado
            $user = $this->getIdentity($request);
            
            // buscar el registro
            $post = Post::where('id',$id)
                    ->where('user_id',$user->sub)->first();
            if(!empty($post) && is_object($post)){
                //actualizar el registro
                $post->update($params_array);
                
                $data = array(
                    'code' => 200,
                    'status' => 'success',
                    'post' => $post,
                    'changes' => $params_array
                );
                
            }
            /*
            $where = [
                'id' => $id,
                'user_id' => $user->sub
            ];
            $post = Post::updateOrCreate($where,$params_array);
            */
            // retornar algo
            
        }
        return response()->json($data,$data['code']);
    }
    
    public function destroy($id ,Request $request){
       // sonseguir el usuario identificado
        $user = $this->getIdentity($request);
        
        // conseguir el registro 
        $post = Post::where('id',$id)
                    ->where('user_id',$user->sub)->first();
        if (!empty($post)){
        // borrar el registro
        $post->delete();
        // devolver algo
            $data = array(
                'code' => 200,
                'status' => 'success',
                'post' => $post
            );
        }else{
            $data = array(
                'code' => 400,
                'status' => 'error',
                'mesasge' => 'El post no existe'
            );
        }
        return response()->json($data,$data['code']);
    }
    
    private function getIdentity($request){
         // conseguir usuari autenticat
        $jwtAuth = new JwtAuth();
        $token = $request->header('Authorization',null);
        $user = $jwtAuth->checkToken($token, true);
         return $user;
    }
    
    public function upload(Request $request){
        // recoger la imagen de la peticion
        $image = $request->file('file0');
        
        // validar la imagen
        $validate = \Validator::make($request->all(),[
            'file0' => 'required|image|mimes:jpg,jpeg,png,gif'
        ]);
        // guardar la imagen en disco
        if(!$image || $validate->fails()){
            $data = [
                'code' => 400,
                'status' => 'error',
                'message' => 'Error al subir la imagen'
            ];
            
        }else{
            $image_name = time().$image->getClientOriginalName();
            \Storage::disk('images')->put($image_name, \File::get($image));
            // devolver datos
            $data = [
                'code' => 200,
                'status' => 'success',
                'image' => $image_name
            ];
        }
        
        return response()->json($data,$data['code']);
    }
    
    public function getImage($filename){
        // comprovar si existe el fichero
        $isset = \Storage::disk('images')->exists($filename);
        
        if($isset){
        // conseguir la imagen
            $file = \Storage::disk('images')->get($filename);
        // devolver la imagen
            return new Response($file,200);
        }else{
            $data = [
                'code' => 404,
                'status' => 'error',
                'message' => 'La imagen no existe'
            ];
        }
        return response()->json($data,$data['code']);
    }
    
    public function getPostsByCategory($id){
        $posts = Post::where('category_id',$id)->get();
        return response()->json([
            'status' => 'success',
            'posts' => $posts
        ],200);              
    }
    
    public function getPostsByUser($id){
        $posts = Post::where('user_id',$id)->get();
        return response()->json([
            'status' => 'success',
            'posts' => $posts
        ],200);              
    }
        
}
