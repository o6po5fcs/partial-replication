#lang racket


(require redex/reduction-semantics
         "JsonLang.rkt"
         racket/format)

(provide PolTreeLang
         make-PolTree
         is-PolTree-readable
         PolTree-project
         migrate-add
         
         migrate-add-obj
         migrate-add-arr
         migrate-add-val
         migrate-del
         migrate-del-arr
         migrate-naive
         make-shard)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; The PolTreeLang formal language ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-extended-language PolTreeLang JsonLang
  (edge ::= (p-exp tree))
  (tree ::= (edge ...)))



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Project a value based on a PolTree instead of a list of privileges ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction
  PolTreeLang
  PolTree-project : v tree env p -> v

  ; readable projection of objects
  [(PolTree-project obj tree env p)
   (PolTree-project-object obj tree env p)]

  ; readable projection of arrays
  [(PolTree-project arr tree env p)
   (PolTree-project-array arr tree env p 0)]

  ; projection of atoms, assuming
  [(PolTree-project atom tree env p)
   atom]
  )

(define-metafunction
  PolTreeLang
  PolTree-project-array : arr tree env p natural -> arr
  
  [(PolTree-project-array (A v_h v_t ...) tree env (k ...) natural)
   (A v_h2 v_t2 ...)
   (judgment-holds (is-PolTree-readable tree (k ... (I natural)) env))
   (where v_h2 (PolTree-project v_h tree env (k ... (I natural))))
   (where natural_incr ,(add1 (term natural)))
   (where (A v_t2 ...) (PolTree-project-array (A v_t ...) tree env (k ...) natural_incr))]

  ; implication: not: (judgment-holds (is-PolTree-readable tree (k ... (I natural)) env))
  [(PolTree-project-array (A v ...) tree env p natural)
   (A)]
  )



(define-metafunction
  PolTreeLang
  PolTree-project-object : obj tree env p -> obj

  [(PolTree-project-object (O) tree env p)
   (O)]
  
  ; readable projection of objects
  [(PolTree-project-object (O (k_1 := v_1) kv_2 ...) tree env (k_p ...))
   (O (k_1 := v_2) kv_3 ...)
   (judgment-holds (is-PolTree-readable tree (k_p ... k_1) env)) ; check in `v` if the extended path is readable
   (where v_2 (PolTree-project v_1 tree env (k_p ... k_1))) ; recursively project the value with an extended path to the root
   (where (O kv_3 ...) (PolTree-project-object (O kv_2 ...) tree env (k_p ...))) ; project the other keys in the object at the same level

   or
   
   (O kv_3 ...)
   ; Implicitly: where not (judgment-holds (is-readable v (k_accum ... k_1) (priv ...) env))
   (where (O kv_3 ...) (PolTree-project-object (O kv_2 ...) tree env (k_p ...)))]
  )


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Check if a path is readable according to a PoLTree              ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(define-judgment-form
  PolTreeLang
  #:mode     (is-PolTree-readable I I I)
  #:contract (is-PolTree-readable tree p env)


  [-------------------- "match"
   (is-PolTree-readable tree () env)]
  
  [(p-exp-matches p-exp k env) (is-PolTree-readable tree (k_rest ...) env)
   -------------------- "traverse"
   (is-PolTree-readable (edge_l ... (p-exp tree) edge_r ...) (k k_rest ...) env)]

  )

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Make a PolTree from a list of privileges      ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(define-metafunction PolTreeLang
  make-PolTree : (priv ...) -> tree

  [(make-PolTree (priv ...))
   (add-privileges () (priv ...))])


(define-metafunction PolTreeLang
  add-privileges : tree (priv ...) -> tree

  [(add-privileges tree (priv_first priv_rest ...))
   (add-privileges tree_new (priv_rest ...))
   (where (ALLOW ps) priv_first)
   (where tree_new (add-privilege tree priv_first ps))]
  
  [(add-privileges tree ())
   tree])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Add a privilege to a PolTree      ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction PolTreeLang
  add-privilege : tree priv ps -> tree
  
  ; follow an existing edge, extend the existing child with the new privilege
  [(add-privilege (edge_x ... (p-exp tree) edge_y ...) priv (p-exp p-exp_rest ...))
   (edge_x ... (p-exp tree_newchild) edge_y ...)
   (where tree_newchild (add-privilege tree priv (p-exp_rest ...)))]

  ; add a new edge to a new child node
  [(add-privilege (edge ...) priv (p-exp p-exp_rest ...))
   (edge ... (p-exp tree_child))
   (where tree_child (add-privilege () priv (p-exp_rest ...)))]

  ; base case
  [(add-privilege tree priv ())
   tree])



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Build a migration for a shard after adding a privilege to a PolTree   ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
                                 
(define-metafunction PolTreeLang
  migrate-add : v v env ps p -> (δ ...)

  ; descend only into keys that match the path expression
  [(migrate-add (O kv ...) obj_s env (p-exp_1 p-exp_2 ...) p)
   (migrate-add-obj (O kv_m ...) obj_s env (p-exp_2 ...) p)
   (where (kv_m ...) (matching-kvs (kv ...) p-exp_1 env))]

  [(migrate-add arr_f arr_s env (A* p-exp_2 ...) p)
   (migrate-add-arr arr_f arr_s env (p-exp_2 ...) p 0)]

  [(migrate-add v_f v_s env ps p)
   ()]
  )


(define-metafunction PolTreeLang
  migrate-add-obj : obj obj env ps p -> (δ ...)

  ; ignore when the full object is empty and the shard is not (this is destructed throughout the recursion in order to process all keys)
  [(migrate-add-obj (O) obj env ps p)
   ()]
   
  ; for keys that also exist in the shard
  ; -> descend down this key and process the other keys
  [(migrate-add-obj (O (k := v_f) kv_f ...) (O kv_s1 ... (k := v_s) kv_s2 ...) env ps (k_path ...))
   (δ_1 ... δ_2 ...)
   (where (δ_1 ...) (migrate-add v_f v_s env ps (k_path ... k)))
   (where (δ_2 ...) (migrate-add-obj (O kv_f ...) (O kv_s1 ... kv_s2 ...) env ps (k_path ...)))]


  ; for keys that do not exist in the shard
  ; -> if it is an atom, add the atom to the shard, and also proceed with the keys on the same level
  ; -> add its empty shell (or the atom itself) to the shard, migrate its contents, and proceed with the keys on the same level
  [(migrate-add-obj (O (k := v) kv_f ...) obj_s env ps (k_path ...))
   (δ_1 ... δ_2 ...)
   (where (δ_1 ...) (migrate-add-val v env ps (k_path ... k)))
   (where (δ_2 ...) (migrate-add-obj (O kv_f ...) obj_s env ps (k_path ...)))])


; project a value that is absent from the shard: add its empty shell, then fill it in
(define-metafunction PolTreeLang
  migrate-add-val : v env ps p -> (δ ...)

  [(migrate-add-val (O kv ...) env ps p)
   ((! p (O)) δ ...)
   (where (δ ...) (migrate-add (O kv ...) (O) env ps p))]

  [(migrate-add-val (A v ...) env ps p)
   ((! p (A)) δ ...)
   (where (δ ...) (migrate-add (A v ...) (A) env ps p))]
  
  [(migrate-add-val atom env ps p)
   ((! p atom))])


(define-metafunction PolTreeLang
  migrate-add-arr : arr arr env ps p natural -> (δ ...)

  ; when the full obj's array is empty, traversal should stop
  [(migrate-add-arr (A) arr_s env ps p natural)
   ()]

  ; when:
  ;  - the full data and the old shard both contain an array with items
  ;  - AND the path is A*
  ;  ---> traverse into the items
  [(migrate-add-arr (A v_fh v_ft ...) (A v_sh v_st ...) env ps (k_path ...) natural)
   (δ_1 ... δ_2 ...)
   (where (δ_1 ...) (migrate-add v_fh v_sh env ps (k_path ... (I natural))))
   (where (δ_2 ...) (migrate-add-arr (A v_ft ...) (A v_st ...) env ps (k_path ...) ,(add1 (term natural))))]

  ; when:
  ;  - the full data has an item at the head of the array,
  ;  - AND the old shard is empty
  ;  - AND the path is now readable due to the A* path selector
  ;  ---> project the array
  [(migrate-add-arr (A v_h v_t ...) (A) env ps (k_path ...) natural)
   (δ_1 ... δ_2 ...)
   (where (δ_1 ...) (migrate-add-val v_h env ps (k_path ... (I natural))))
   (where (δ_2 ...) (migrate-add-arr (A v_t ...) (A) env ps (k_path ...) ,(add1 (term natural))))]
  
  )



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Auxiliary metafunction: get all kvs that match a path expression      ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(define-metafunction PolTreeLang
  matching-kvs : (kv ...) p-exp env -> (kv ...)
  
  [(matching-kvs () _ _)
   ()]
  
  [(matching-kvs ((k := v) kv ...) p-exp env)
   ((k := v) kv_rest ...)
   (where (kv_rest ...) (matching-kvs (kv ...) p-exp env))
   (judgment-holds (p-exp-matches p-exp k env))]

  [(matching-kvs ((k := v) kv ...) p-exp env)
   (matching-kvs (kv ...) p-exp env)])



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Build a migration for a shard after removing a privilege from a PolTree   ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(define-metafunction PolTreeLang
  migrate-del : v tree env ps p -> (δ ...)

  [(migrate-del v tree env ps p)
   ((!! p))
   (side-condition (not (judgment-holds (is-PolTree-readable tree p env))))]
  
  [(migrate-del (O (k := v) kv ...) tree env (p-exp_1 p-exp_2 ...) (k_path ...))
   (δ_1 ... δ_2 ...)
   (judgment-holds (p-exp-matches p-exp_1 k env))
   (where (δ_1 ...) (migrate-del v tree env (p-exp_2 ...) (k_path ... k)))
   (where (δ_2 ...) (migrate-del (O kv ...) tree env (p-exp_1 p-exp_2 ...) (k_path ...)))
   ]

  [(migrate-del (O (k := v) kv ...) tree env ps p)
   (migrate-del (O kv ...) tree env ps p)
   ]
  
  [(migrate-del arr tree env ps p)
   (migrate-del-arr arr tree env ps p 0)]

  [(migrate-del v tree env ps p)
   ()]  
  )

(define-metafunction PolTreeLang
  migrate-del-arr : arr tree env ps p natural -> (δ ...)

  ; when:
  ;  - the full data has an item at the head of the array,
  ;  - AND the old shard has an item at the head of the array (assumed to be the same item, e.g., same object which may still differ internally)
  ;  - AND the path is still readable
  ;  ---> traverse into the items
  [(migrate-del-arr (A v_h v_t ...) tree env (A* p-exp ...) (k_path ...) natural)
   (δ_1 ... δ_2 ...)
   (where (δ_1 ...) (migrate-del v_h tree env (p-exp ...) (k_path ... (I natural))))
   (where (δ_2 ...) (migrate-del-arr (A v_t ...) tree env (A* p-exp ...) (k_path ...) ,(add1 (term natural))))]

  ; this clause is reached when ps does not have A* at the front
  [(migrate-del-arr arr tree env ps p natural)
   ()]
  )


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Auxiliary function: a naive strategy to build a migration based on comparing two shards  ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


; compare two values, returns a migration that transforms one value into another value
; e.g., old shard into new shard.
(define-metafunction PolTreeLang
  migrate-naive : v v p -> (δ ...)

  [(migrate-naive atom atom p)
   ()]

  [(migrate-naive obj_f obj_s p)
   (migrate-naive-obj obj_f obj_s p)]

  [(migrate-naive arr_f arr_s p)
   (migrate-naive-arr arr_f arr_s p 0)])

(define-metafunction PolTreeLang
  migrate-naive-obj : v v p -> (δ ...)

  [(migrate-naive-obj (O) (O) p)
   ()]
  
  ; if there is a common key "k" with the *same value*, ignore it and process the other keys at the same level
  [(migrate-naive-obj (O (k_common := v) kv_old ...)
                      (O kv_new1 ... (k_common := v) kv_new2 ...)
                      (k_path-to-root ...))
   (migrate-naive-obj (O kv_old ...)
                      (O kv_new1 ... kv_new2 ...)
                      (k_path-to-root ...))]

  ; if there is a common key "k" with a *different value*, traverse into that object and process everything else at the same level
  [(migrate-naive-obj (O (k_common := v_1) kv_old ...)
                      (O kv_new1 ... (k_common := v_2) kv_new2 ...)
                      (k_path-to-root ...))
   (δ_1 ... δ_2 ...)
   (where (δ_1 ...) (migrate-naive v_1 v_2 (k_path-to-root ... k_common)))
   (where (δ_2 ...) (migrate-naive-obj (O kv_old ...)
                                       (O kv_new1 ... kv_new2 ...)
                                       (k_path-to-root ...)))]
  
  ; if there is a key present in the old object which is not present in the new object, it should be removed from the old object
  [(migrate-naive-obj (O (k_old := v_old) kv_old ...)
                      (O (k_new := v_new) ...)
                      (k_path-to-root ...))
   ((!! (k_path-to-root ... k_old)) δ ...)
   (where (δ ...) (migrate-naive-obj (O kv_old ...) (O (k_new := v_new) ...) (k_path-to-root ...)))
   (side-condition (not (member (term k_old) (term (k_new ...)))))
   ]

  ; if there is a key present in the new object which is not present in the old object, it should be added to the data
  ;   if the value of the key is an atom -> add the atom
  [(migrate-naive-obj (O (k_old := v_old) ...)
                      (O (k_new := v_new) kv_new ...)
                      (k_path-to-root ...))
   ((! (k_path-to-root ... k_new) v_new) δ ...)
   (where (δ ...) (migrate-naive-obj (O (k_old := v_old) ...)
                                     (O kv_new ...)
                                     (k_path-to-root ...)))
   (side-condition (not (member (term k_new) (term (k_old ...)))))]


  )

(define-metafunction PolTreeLang
  migrate-naive-arr : arr arr p natural -> (δ ...)

  ; catchall for empty arrays
  [(migrate-naive-arr (A) (A) p natural)
   ()]

  ; catchall when the array of the old shard holds entries and the projected array *does not*
  ; this means that they should be removed from the first shard to get to the modified shard
  [(migrate-naive-arr (A v_h v_t ...) (A) (k ...) natural)
   ((!! (k ... (I natural))) δ ...)
   (where natural_inc ,(add1 (term natural)))
   (where (δ ...) (migrate-naive-arr (A v_t ...) (A) (k ...) natural_inc))]

  ; catchall when the array of the new shard holds entries and the old array does not
  ; this means that they should be added to the old shard to get to get to the modified shard
  [(migrate-naive-arr (A) (A v_h v_t ...) (k ...) natural)
   ((! (k ...) (A v_h v_t ...)))
   #;(where natural_inc ,(add1 (term natural)))
   #;(where (δ ...) (migrate-naive-arr (A) (A v_t ...) (k ...) natural_inc))]

  
  ; Compare the elements of elements at the same position of the old shard and new shard.
  ; They are assumed to be the same elements (e.g., no comparing of shards that also
  ; include other operations that changed the second shard)
  [(migrate-naive-arr (A v_fh v_ft ...) (A v_sh v_st ...) (k ...) natural)
   (δ_1 ... δ_2 ...)
   (where natural_inc ,(add1 (term natural)))
   (where (δ_1 ...) (migrate-naive v_fh v_sh (k ... (I natural))))
   (where (δ_2 ...) (migrate-naive-arr (A v_ft ...) (A v_st ...) (k ...) natural_inc))]
  )


(define-metafunction PolTreeLang
  make-shard : v (priv ...) env -> v
  [(make-shard v (priv ...) env)
   (project v (priv ...) v env ())])
