#lang racket


(require redex/reduction-semantics)

(provide JsonLang
         json-read-existing-path
         json-write
         json-write-compound
         json-apply-ops
         json-delete
         value-to-paths
         array-to-keys
         object-to-keys
         δ-path
         array-ref
         project
         project-object
         project-array

         is-readable
         should-be-readable
         env-script-holds
         atom-script-holds
         script-holds
         matches-in-env
         p-exp-matches
         element-of
         list-without
         matches-ps-partially

         kv-key
         kv-value
         )


(define-language JsonLang
  ;; Atomic, primitive values
  (atom ::= number boolean string quoted)
  (quoted ::= (quote variable))
    
  ;; JSON data
  (obj ::= (O kv ...))
  (kv ::= (ok := v))
  (arr ::= (A v ...))
  (ok ::= variable integer)
  (ak ::= (I natural))
  
  (v ::= atom obj arr)
  
  ; Paths
  (p ::= (k ...))
  (k ::= ok ak)
  
  ; Changes ("deltas")
  (δ ::= (! p v) (!! p))

  ; Privileges
  (priv ::= (ALLOW ps))

  ; Path selectors
  (ps ::= (p-exp ...))
  (p-exp ::= k * A* [script-op (~ k ...)] [script-op k])

  ; User environment
  (env ::= obj)

  (var := variable)
  ; Operators usable in a script expression
  (script-op ::= ∈ ∋ < > ≤ ≥ ≠ =))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Constructs a shard of a JSON object from a shard query                                      ;;
;; Note that the first argument is de-/reconstructed during                                    ;;
;; recursion, while the third argument keeps referring to the whole object.                    ;;
;; The path argument  is similarly used in recursion, and should initially be empty.           ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction
  JsonLang
  project : v (priv ...) v env p -> v

  ; readable projection of objects
  [(project obj (priv ...) v env p)
   (project-object obj (priv ...) v env p)]

  ; readable projection of arrays
  [(project arr (priv ...) v env p)
   (project-array arr (priv ...) v env p 0)]

  ; projection of atoms, assuming
  [(project atom (priv ...) v env p)
   atom]
  )


(define-metafunction
  JsonLang
  project-array : arr (priv ...) v env p natural -> arr
  
  [(project-array (A v_h v_t ...) (priv ...) v env (k ...) natural)
   (A v_h2 v_t2 ...)
   (judgment-holds (is-readable (k ... (I natural)) (priv ...) env))
   (where v_h2 (project v_h (priv ...) v env (k ... (I natural))))
   (where natural_incr ,(add1 (term natural)))
   (where (A v_t2 ...) (project-array (A v_t ...) (priv ...) v env (k ...) natural_incr))]

  ; implication: not: (judgment-holds (is-readable v (k ... (I natural)) (priv ...) env))
  [(project-array (A v_arr ...) (priv ...) v env p natural)
   (A)]
  )


(define-metafunction
  JsonLang
  project-object : obj (priv ...) v env p -> obj

  [(project-object (O) (priv ...) v env p)
   (O)]
  
  ; readable projection of objects
  [(project-object (O (k_1 := v_1) kv_2 ...) (priv ...) v env (k_p ...))
   (O (k_1 := v_2) kv_3 ...)
   (judgment-holds (is-readable (k_p ... k_1) (priv ...) env))
   (where v_2 (project v_1 (priv ...) v env (k_p ... k_1))) ; recursively project the value with an extended path to the root
   (where (O kv_3 ...) (project-object (O kv_2 ...) (priv ...) v env (k_p ...))) ; project the other keys in the object at the same level

   or
   
   (project-object (O kv_2 ...) (priv ...) v env (k_p ...))
   ; Implicitly: where not (judgment-holds (is-readable v (k_accum ... k_1) (priv ...) env))
   ]
  )

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Checks whether path is readable according to the privileges and environment.                   ;;
;;                                                                                                ;;
;; Holds iff the path matches the the path selector or a prefix                                   ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode     (is-readable I I I)
  #:contract (is-readable p (priv ...) env)

  [(matches-ps-partially ps p env)
   --------------------
   (is-readable p (priv_l ... (ALLOW ps) priv_r ...) env)])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Checks whether path is readable according to the privileges and environment, independent of the concrete data.           ;;
;;                                                                                                                          ;;
;; Holds iff the path matches (a prefix of) a path selector                                                                 ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode     (should-be-readable I I I)
  #:contract (should-be-readable p (priv ...) env)

  [(matches-ps-partially ps p env)
   --------------------
   (should-be-readable p (priv_l ... (ALLOW ps) priv_r ...) env)])



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Checks whether a script expression holds in a user environment. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode     (env-script-holds I I I I)
  #:contract (env-script-holds script-op k (k ...) env)

  [(where (kv_1 ... (k_2 := atom_2) kv_3 ...) env)
   (atom-script-holds script-op atom_2 k)
   -------------------- "Holds for atom"
   (env-script-holds script-op k (k_2) env)]

  [(where (kv_1 ... (k_2 := v_2) kv_3 ...) env)
   (where (kv_4 ... (k_5 := number) kv_6 ...) v_2)
   -------------------- " Holds if number in"
   (env-script-holds ∈ number (k_2) env)]

  [(where (kv_1 ... (k_2 := v_2) kv_3 ...) env)
   (where (kv_4 ... (k_5 := (quote var)) kv_6 ...) v_2)
   -------------------- " Holds if identifier in"
   (env-script-holds ∈ var (k_2) env)]

  [(where (kv_1 ... (k_2 := v_2) kv_3 ...) env)
   (env-script-holds script-op k (k_4 ...) v_2)
   -------------------- "Recur"
   (env-script-holds script-op k (k_2 k_4 ...) env)]
  )


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Checks whether a script expression holds for 2 constants. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode     (script-holds I I I)
  #:contract (script-holds script-op k k)

  [(atom-script-holds script-op number k)
   -------------------- "Holds for number"
   (script-holds script-op number k)]
  [(atom-script-holds script-op (quote var) k)
   -------------------- "Holds for identifier"
   (script-holds script-op var k)])

(define-judgment-form
  JsonLang
  #:mode     (atom-script-holds I I I)
  #:contract (atom-script-holds script-op atom k)

  [-------------------- "Holds if quoted eq"
   (atom-script-holds = (quote variable) var)]
  [-------------------- "Holds if number eq"
   (atom-script-holds = number number)]
  [(side-condition ,(not (equal? (term i_1) (term i_2))))
   -------------------- "Holds if quoted neq"
   (atom-script-holds ≠ (quote var_1) var_2)]
  [(side-condition ,(not (equal? (term number_1) (term number_2))))
   -------------------- "Holds if number neq"
   (atom-script-holds ≠ number_1 number_2)]
  [(side-condition ,(< (term number_2) (term number_1)))
   -------------------- "Holds if number lt"
   (atom-script-holds < number_1 number_2)]
  [(side-condition ,(<= (term number_2) (term number_1)))
   -------------------- "Holds if number le"
   (atom-script-holds ≤ number_1 number_2)]
  [(side-condition ,(> (term number_2) (term number_1)))
   -------------------- "Holds if number gt"
   (atom-script-holds > number_1 number_2)]
  [(side-condition ,(>= (term number_2) (term number_1) ))
   -------------------- "Holds if number ge"
   (atom-script-holds ≥ number_1 number_2)])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Checks whether a path selector matches a path in a user environment. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode     (matches-in-env I I I)
  #:contract (matches-in-env ps p env)
  
  [--------------------------------- "empty-selector"
   (matches-in-env () () env)]
  [(p-exp-matches p-exp_1 k_1 env) (matches-in-env (p-exp_2 ...) (k_2 ...) env)
   --------------------------------- "p-exp matches"
   (matches-in-env (p-exp_1 p-exp_2 ...) (k_1 k_2 ...) env)])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Checks whether a (part of a) path selector matches a path in a user environment. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode     (matches-ps-partially I I I)
  #:contract (matches-ps-partially ps p env)
  
  [--------------------------------- "partial"
   (matches-ps-partially ps () env)]

  [(p-exp-matches p-exp_1 k_1 env) (matches-ps-partially (p-exp_2 ...) (k_2 ...) env)
   --------------------------------- "match"
   (matches-ps-partially (p-exp_1 p-exp_2 ...) (k_1 k_2 ...) env)])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Checks whether a key of a path matches a path expression in a user environment. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode     (p-exp-matches I I I)
  #:contract (p-exp-matches p-exp k env)
  
  [--------------------------------- "literal"
   (p-exp-matches ok ok env)]

  [--------------------------------- "wildcard"
   (p-exp-matches * ok env)]

  [--------------------------------- "array"
   (p-exp-matches A* ak env)]
  
  [(script-holds script-op ok_2 ok_1)
   --------------------------------- "script"
   (p-exp-matches [script-op ok_2] ok_1 env)]
  
  [(env-script-holds script-op ok_1 (ok ...) env)
   --------------------------------- "env-script"
   (p-exp-matches [script-op (~ ok ...)] ok_1 env)])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Auxiliary metafunctions to get values from key-value terms       ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction
  JsonLang
  kv-key : kv -> ok
  [(kv-key (ok := v))
   ok])

(define-metafunction
  JsonLang
  kv-value : kv -> v
  [(kv-value (ok := v))
   v])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Auxiliary judgment form: selects element from list. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-judgment-form
  JsonLang
  #:mode (element-of O I)
  #:contract (element-of any (any ...))

  [(where (_ ... any_e _ ...) (any_all ...))
   --------------------
   (element-of any_e (any_all ...))])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Auxiliary metafunction: removes element from list. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction
  JsonLang
  list-without : (any ...) any -> (any ...)

  [(list-without (any_l ... any_m any_r ...) any_m)
   (any_l ... any_r ...)]
  [(list-without (any_1 ...) any_2)
   (any_1 ...)])



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Reads a value from a path in a JSON object.  ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  json-read-existing-path : v p -> v
  [(json-read-existing-path v ()) v]
  
  [(json-read-existing-path (O kv_1 ... (k_1 := v) kv_2 ...) (k_1 k_2 ...))
   (json-read-existing-path v (k_2 ...))]
  
  [(json-read-existing-path (A v ...) (k_1 k_2 ...))
   (json-read-existing-path v_value (k_2 ...))
   (where (some v_value) (array-ref (A v ...) k_1))])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Writes a value to a path into a JSON object. ;;
;;                                              ;;
;; Returns the updated JSON object.             ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  json-write : v p v -> v

  ; Base case: empty path, replace entire value
  [(json-write v_old () v_new)
   v_new]

  ; Case for objects: path starts with a key that exists in the object
  [(json-write (O kv_1 ... (k_1 := v_old) kv_2 ...)
               (k_1 k_2 ...)
               v_new)
   (O kv_1 ... (k_1 := v_modified) kv_2 ...)
   (where v_modified (json-write v_old (k_2 ...) v_new))]

  ; Case for objects: path starts with a key that doesn't exist, add it
  [(json-write (O kv ...)
               (k_1 k_2 ...)
               v_new)
   (O kv ... (k_1 := v_created))
   (where v_created (json-write (O) (k_2 ...) v_new))]

  ; write to empty array
  [(json-write (A)
               ((I 0))
               v_new)
   (A v_new)]
  
  
  ; Array: index 0 (i.e., found location where to write value)
  [(json-write (A v_0 v_rest ...)
               ((I 0) k_2 ...)
               v_new)
   (A v_modified v_rest ...)
   (where v_modified (json-write v_0 (k_2 ...) v_new))]

  ; Arrays: index > 0 (-> decrement index until element found)
  [(json-write (A v_head v_tail ...)
               ((I natural) k_2 ...)
               v_new)
   (A v_head v_tail_modified ...)
   (where (A v_tail_modified ...) (json-write (A v_tail ...) ((I ,(sub1 (term natural))) k_2 ...) v_new))])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Add a JSON object to a path of another JSON object.        ;;
;; Keys that already exist are traversed, others are created. ;;
;;                                                            ;;
;; Returns the updated JSON object.                           ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; Onto `json_1` at `p`: write `json_2`. Receive the updated `json_3`.
(define-metafunction
  JsonLang
  json-write-compound : v p v -> v
  
  [(json-write-compound v_old () v_new)
   v_new]

  [(json-write-compound (O kv_1 ... (k_2 := v_2) kv_3 ...)
                        (k_2 k_4 ...)
                        v_new)
   (O kv_1 ... (k_2 := v_2′) kv_3 ...)
   (where v_2′ (json-write-compound v_2 (k_4 ...) v_new))]

  [(json-write-compound (O kv_1 ...) (k_2 k_4 ...) v_new)
   (O kv_1 ... (k_2 := v_2′))
   (where v_2′ (json-write-compound (O) (k_4 ...) v_new))]

  [(json-write-compound atom_old (k_2 k_4 ...) v_new)
   (O (k_2 := v_2′))
   (where v_2′ (json-write-compound (O) (k_4 ...) v_new))]

  [(json-write-compound arr_old (natural) v_new)
   arr_new
   (where arr_new (array-set arr_old (natural) v_new))]

  [(json-write-compound arr_old (natural k ...) v_new)
   arr_new
   (where (some v_arr) (array-ref arr_old natural))
   (where v_new2 (json-write-compound v_arr (k ...) v_new))
   (where arr_new (array-set arr_old (natural) v_new2))])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Apply a set of operations to a JSON object.  ;;
;;                                              ;;
;; Returns the updated JSON object.             ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  json-apply-ops : v (δ ...) -> v
  [(json-apply-ops v ())
   v]
  [(json-apply-ops v ((! p v_to_write) δ ...))
   (json-apply-ops v_new (δ ...))
   (where v_new (json-write v p v_to_write))]
  [(json-apply-ops v ((!! p) δ ...))
   (json-apply-ops v_new (δ ...))
   (where v_new (json-delete v p))])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Deletes a path from a JSON object            ;;
;;                                              ;;
;; Returns the updated JSON object.             ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  json-delete : v p -> v
  [(json-delete v ())
   v]

  ; base case: delete object key
  [(json-delete (O kv_1 ... (k := v) kv_2 ...)
                (k))
   (O kv_1 ... kv_2 ...)]

  ; base case: delete array key at head
  [(json-delete (A v_head v_tail ...)
                (0))
   (A v_tail ...)]

  ; array recursive: delete key in tail
  [(json-delete (A v_head v_tail ...)
                (natural))
   (A v_head v_new ...)
   (where (A v_new ...) (json-delete (A v_tail ...) ,(sub1 (term natural))))]

  ; descend into object
  [(json-delete (O kv_1 ... (k := v) kv_2 ...)
                (k k_rest ...))
   (O kv_1 ... (k := v_new) kv_2 ...)
   (where v_new (json-delete v (k_rest ...)))]

  ; descend into array in first location
  [(json-delete (A v_head v_tail ...)
                (0 k ...))
   (A v_new_head v_tail ...)
   (where v_new_head (json-delete v_head (k ...)))]
  
  ; descend into array (find index)
  [(json-delete (A v_head v_tail ...)
                (natural k ...))
   (A v_head v_new_tail ...)
   (where (A v_new_tail ...) (json-delete (A v_tail ...) (,(sub1 (term natural)) k ...)))]
  )



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Auxiliary metafunctions:                                     ;;
;; Determine all paths that exist in a JSON data structure.     ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  value-to-paths : v -> (p ...)
  ([value-to-paths atom]
   ())
  [(value-to-paths obj)
   (object-to-keys obj ())]
  [(value-to-paths arr)
   (array-to-keys arr 0 ())])


(define-metafunction JsonLang
  object-to-keys : obj p -> (p ...)

  [(object-to-keys (O (k_1 := v_1) kv ...) (k_3 ...))
   (p_r ... p_l ...)
   (where (p_l ...) (json-to-keys v_1 (k_3 ... k_1)))
   (where (p_r ...) (object-to-keys (O kv ...) (k_3 ...)))]

  [(object-to-keys (O) ())
   ()]

  [(object-to-keys (O) (k ...))
   ((k ...))]
  )

(define-metafunction JsonLang
  array-to-keys : arr natural p -> (p ...)
  
  [(array-to-keys (A v_head v_tail ...) natural (k ...))
   (p_l ... p_r ...)
   (where natural_incr ,(add1 (term natural)))
   (where (p_l ...) (json-to-keys v_head (k ... (I natural))))
   (where (p_r ...) (array-to-keys (A v_tail ...) natural_incr (k ...)))]
  
  [(array-to-keys (A) natural (k ...))
   ((k ...))]
  )

(define-metafunction JsonLang
  json-to-keys : v p -> (p ...)
  [(json-to-keys atom p)
   (p)]
  [(json-to-keys obj p)
   (object-to-keys obj p)]
  [(json-to-keys arr p)
   (array-to-keys arr 0 p)]
  )




;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Returns the path of a delta.                 ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  δ-path : δ -> p
  [(δ-path (! p atom)) p]
  [(δ-path (!! p)) p])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Returns the value in an array at an index, or (none)     ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  array-ref : arr ak -> (some v) or (none)
  
  ;; If the index is 0, return the head
  [(array-ref (A v_h v_t ...) (I 0))
   (some v_h)]
  
  ;; If index > 0, recurse on the tail
  [(array-ref (A v_h v_t ...) (I natural))
   (array-ref (A v_t ...) (I ,(sub1 (term natural))))
   (side-condition (> (term natural) 0))]
  
  ;; Any other case (empty array, negative or non-natural index, ...)
  [(array-ref arr any)
   (none)])




;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Set the value of an array at an index, which must be within the existing range of the array  ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction JsonLang
  array-set : arr ak v -> arr

  ;; If the index is 0, return the head
  [(array-set (A v_h v_t ...) (I 0) v)
   (A v v_t ...)]

  ;; If index > 0, recurse on the tail
  [(array-set (A v_h v_t ...) (I natural) v)
   (A v_h v_t2 ...)
   (where natural_decr ,(sub1 (term natural)))
   (where (A v_t2 ...) (array-set (A v_t ...) (I natural_decr) v))]
  )