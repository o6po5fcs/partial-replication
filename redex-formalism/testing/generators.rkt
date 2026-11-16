#lang racket

(require rackcheck
         redex/reduction-semantics
         "../formalism/JsonLang.rkt"
         "../formalism/PolTreeLang.rkt"
         )

(provide
 WILDCARD-PATH-EXPRESSION

 gen:atom
 gen:path
 
 gen:object
 gen:non-empty-object
 (struct-out GeneratedObject)
 (struct-out UnionCandidate)

 gen:READ-privilege
 gen:privilege
 gen:security-policy
 gen:non-empty-security-policy
 (struct-out GeneratedPaths)
 (struct-out SecurityPolicy)

 gen:user-env
 )

(define WILDCARD-PATH-EXPRESSION '*)
(define ARRAY-WILDCARD-PATH-EXPRESSION 'A*)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Helpers                                                            ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (path-selector? any)
  (redex-match? JsonLang ps (term ,any)))

(define (permission? any)
  (eq? any 'READ))

(define (path? any)
  (redex-match? JsonLang p (term ,any)))

(define (object? any)
  (redex-match? JsonLang obj (term ,any)))

(define (array? any)
  (redex-match? JsonLang arr (term ,any)))

(define (empty-object? any)
  (redex-match? JsonLang (O) (term ,any)))

(define (security-policy-excerpt? any)
  (redex-match? JsonLang (priv ...) (term ,any)))

(define (user-env? any)
  (redex-match? JsonLang obj (term ,any)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Returns all possible field access paths of an object from the root ;;
;; object to leaves (fields that contain plain data, i.e., atoms).    ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (get-all-paths value)
  (term (value-to-paths ,value)))


; Make a generator that generates values
(define gen:atom
  (gen:map gen:natural
           (lambda (number)
             (generate-term JsonLang atom #:i-th number))))

; Make a generator that generates random paths
(define/contract (gen:path #:max-length [max-len 5])
  (->* () [#:max-length exact-nonnegative-integer?] gen?)
  (gen:let ([list-of-numbers (gen:list gen:natural #:max-length max-len)])
           (map (lambda (number) (generate-term JsonLang k #:i-th number))
                list-of-numbers)))


; Make a generator that generates write operations ("!" terms).
;  - Requires a generator that makes paths, and a generator that makes values

(define/contract (gen:! path-generator value-generator)
  (-> gen? gen? gen?)
  
  (gen:let ([path path-generator]
            [value value-generator])
           (define generated-term (term (! ,path ,value)))

           (unless (redex-match? JsonLang δ generated-term)
             (error "The generated δ term is not a valid JsonLang term" generated-term))

           generated-term))

; Make a generator that generates delete operations ("!!" terms).
;  - Requires a generator that makes paths
(define/contract (gen:!! path-generator)
  (-> gen? gen?)
  
  (gen:let ([path path-generator])
           (term (!! ,path))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Clean up invalid (but randomly generatable) json, with: ;;
;;   - duplicate keys at the same level, and               ;;
;;   - empty objects.                                      ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-metafunction
  JsonLang
  cleanup-data : v (k ...) -> v
  [(cleanup-data atom (k ...))
   atom]
  [(cleanup-data obj (k ...))
   (cleanup-obj obj (k ...))]
  [(cleanup-data arr (k ...))
   (cleanup-arr arr (k ...) 0)])

(define-metafunction
  JsonLang
  cleanup-obj : obj (k ...) -> obj
  
  [(cleanup-obj (O) _)
   (O)]

  ; replace empty objects with some more useful data
  [(cleanup-obj (O (k_1 := (O)) kv ...) (k_seen ...))
   (cleanup-obj (O (k_1 := ,(generate-term JsonLang atom 2)) kv ...) (k_seen ...))]

  ; check if there is a key in the object that we haven't seen before, if yes, add it to the 'seen' set.
  [(cleanup-obj (O (k_1 := v_1) kv_t ...) (k_seen ...))
   (O (k_1 := v_1′) kv_t2 ...)
   (side-condition (not (member (term k_1) (term (k_seen ...)))))
   (where v_1′ (cleanup-data v_1 ())) ; cleanup the value with an empty seen set
   (where (O kv_t2 ...) (cleanup-data (O kv_t ...) (k_1 k_seen ...)))]


  ; implication: (member (term k_1) (term (k_seen ...)))
  [(cleanup-obj (O kv_h kv_t ...) (k_seen ...))
   (O kv_t2 ...)
   (where (O kv_t2 ...) (cleanup-obj (O kv_t ...) (k_seen ...)))])



(define-metafunction
  JsonLang
  cleanup-arr : arr (k ...) natural -> arr
  
  [(cleanup-arr (A) (k_seen ...) natural)
   (A)]
  
  [(cleanup-arr (A v_h v_t ...) (k_seen ...) natural)
   (A v_h2 v_t2 ...)
   (where natural_incr ,(add1 (term natural)))
   (where v_h2 (cleanup-data v_h ()))
   (where (A v_t2 ...) (cleanup-arr (A v_t ...) () natural_incr))])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Make a generator that makes objects whose size is bounded by the given a particular  ;;
;; depth. The depth is defined by Redex as the size of the parse tree.                  ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define/contract (gen:basic-object)
  (-> gen?)
  (gen:bind gen:natural
            (lambda (number)
              (gen:const (term (cleanup-data ,(generate-term JsonLang obj #:i-th (expt number 50)) ()))))))

(struct UnionCandidate (replaced-path path-prefix path-expression) #:transparent)
(struct GeneratedObject (object union-candidates) #:transparent)

(define (non-empty-GeneratedObject? generated-object)
  (define object (GeneratedObject-object generated-object))
  (not (redex-match? JsonLang object (term (O)))))

#;(define (add-unions-to-object obj unionify-every)
  (define current-key-counter 0)
    
  (define (top-level-kvs v)
    (cond ((redex-match? JsonLang atom v)
           '())
          ((redex-match? JsonLang arr v)
           (sequence->list (in-range 0 (length (rest v)))))
          ((redex-match? JsonLang obj v)
           (map (lambda (kv) (cons (first kv) (last kv)))
                ; grab the tail to avoid the 'O symbol at the start of an object.
                (rest v)))
          (else (error "unknown json type"))))

  (define (unionify-1-kv! current-path key json)
    (define should-unionify? (and (= current-key-counter unionify-every)
                                  (not (redex-match? JsonLang arr (term (json-read-existing-path ,obj ,current-path))))))
    (define full-old-path (append current-path (list key)))
    (define unionified-children (unionify! full-old-path json))
    (if should-unionify?
        (let* ((new-key (gensym))
               (full-new-path (append current-path (list new-key))))
          (set! current-key-counter 0)
          ;(displayln "calling json-write-compound: ") (displayln (term (json-write-compound ,obj ,full-new-path ,json)))
          (set! obj (term (json-write-compound ,obj ,full-new-path ,json)))
          (cons (UnionCandidate full-old-path current-path (term [∪ ,key ,new-key]))
                (unionify! full-old-path json)))
        unionified-children))
          
 
  (define (unionify! current-path v)
    (cond ((redex-match? JsonLang atom v)
           '())
          ((redex-match? JsonLang arr v)
           '())
          ((redex-match? JsonLang obj v)
           (let ((kvs-on-current-level (top-level-kvs v)))
             (define union-candidates (map (lambda (kv)
                                             (set! current-key-counter (+ current-key-counter 1))
                                             (define key (car kv))
                                             (define json (cdr kv))
                                             (unionify-1-kv! current-path key json))
                                           kvs-on-current-level))
             union-candidates))
          (else (error "unknown json type"))))

  (define union-candidates (flatten (unionify! '() obj)))
  (values union-candidates obj))

(define gen:object  
  (gen:let ([obj (gen:basic-object)]
            #;[unionify-every (gen:integer-in 3 10)])
           #;(define-values (union-candidates new-obj) (add-unions-to-object obj unionify-every))
           (GeneratedObject obj '())))

(define gen:non-empty-object
  (gen:filter gen:object
              (lambda (generated-object)
                (not (empty-object? (GeneratedObject-object generated-object))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Generate an object in CommonLang that represents a      ;;
;; valid array, i.e., an object where the keys are indices ;;
;; (from 0 to size) and the values are the array's values. ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (make-array-object #:max-size [size 3] #:must-include-val [must-include (void)])
  (define (gen-atoms)
    (for/list ([i (in-range 1 size)])
      (term (quote ,(gensym)))))
  (define arr-values (shuffle (if (void? must-include) (gen-atoms) (cons must-include (gen-atoms)))))
  (define naturals (stream->list (in-range 0 (length arr-values))))
  (map (lambda (idx val)
         (term (,idx := ,(if (symbol? val)
                             (term ',val)
                             val))))
       naturals arr-values))


(define (make-array #:max-size [size 3] #:must-include-val [must-include (void)])
  (define (gen-atoms)
    (for/list ([i (in-range 1 size)])
      (term (quote ,(gensym)))))
  (define arr-values (shuffle (if (void? must-include) (gen-atoms) (cons must-include (gen-atoms)))))
  (cons 'A arr-values))

(struct GeneratedPaths (path-selectors user-env paths-excluded-from-user-env newly-invented-paths) #:transparent)

(define/contract (make-path-selectors generated-object)
  (-> GeneratedObject? GeneratedPaths?)
  
  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  ;; "expressionify-paths" arguments                                                                                         ;;
  ;;   - paths:gen:READ-privilege the list of paths to potentially mutate                                                                      ;;
  ;;   - union-candidates: a list of UnionCandidate objects 
  ;; keyword arguments:                                                                                                      ;;
  ;;   - #:expressionify-nth-path-segment: Every nth path segment is transformed into a more complex path expression         ;;
  ;;   - #:make-nth-unreadable: When a mutation occurs, every nth mutation will become unreadable, i.e.,                     ;;
  ;;                                the path becomes unreadable by not including the required field in the user environment  ;;
  ;; "mutate-paths" return values:                                                                                           ;;
  ;;   - path-selectors: all paths that potentially contain wildcards                                                        ;;
  ;;   - user-environment: the user environment which does or does not include the necessary fields to gain access to a path ;;
  ;;   - paths-made-unreadable: list of field access paths that were made unreadable though random chance, e.g.,             ;;
  ;;                            because the mutation (= of ∈) did not include the necessary field in the user's env          ;;
  ;;   - newly-invented-paths: a list of flat paths that didn't exist in the object, but that now exist due to               ;;
  ;;                           the introduction of path expressions                                                          ;;
  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

  (define (expressionify-paths paths
                               union-candidates
                               object
                               #:expressionify-nth-path-segment [path-expression-every 5]
                               #:make-nth-unreadable [unreadable-every 3]
                               #:unionify-nth-path [use-union-every 3])
    (define mutate-ctr 0) ; 0 -> (length mutations)
    (define path-expression-ctr 0)   ; 0 -> wildcard-every
    (define unreadable-ctr 0) ; 0 -> unreadable-every
    (define union-ctr 0)      ; 0 -> use-union-every
    (define mutate-=-state 0) ; 0 -> 4
    
    (define paths-excluded-from-user-env '())
    (define newly-invented-paths '())
    (define user-environment (term (O)))

    ; turn a single path into a path selector that potentially includes various kinds of path expressions
    ;; returns a path expression, and modifies the user-environment found in scope
    (define (path->path-selector path)
      ; replace a single path by an "=" wildcard
      (define (mutate-= path-segment make-unreadable?)
        (define symbol (gensym))
        (define kv-for-user-env #f)
        (define replacement-path-segment
          (let ((state mutate-=-state))
            (set! mutate-=-state (modulo (+ mutate-=-state 1) 5))
            (cond ((= state 0)
                   (term [> ,state]))
                  ((= state 1)
                   (term [< ,state]))
                  ((= state 2)
                   (term [= ,symbol]))
                  ((= state 3)
                   (term [= ,path-segment]))
                  ((= state 4)
                   (unless make-unreadable?
                     (set! kv-for-user-env
                           (term (,symbol := ,(if (symbol? path-segment)
                                                  (term ',path-segment)
                                                  path-segment)))))
                   (term [= [~ ,symbol]]))
                  (else (error "state out of range" state)))))
        ;(report "symbol" symbol)
        ;(report "symbol?" (symbol? symbol))
        ;(report "path-segment" path-segment)
        ;(report "symbol? path-segment" (symbol? path-segment))
        ;(report "replacement-path-segment" replacement-path-segment)
      
        (values replacement-path-segment kv-for-user-env))

      ; replace a single path segment by a "∈" wildcard
      (define (mutate-∈ path-segment make-unreadable?)
        (define symbol (gensym))
        (define path-segment-symbol
          (cond ((redex-match? JsonLang variable (term ,path-segment))
                 (term (quote ,path-segment)))
                ((redex-match? JsonLang atom (term ,path-segment))
                 path-segment)
                (else (error "cannot convert path segment to something that fits into an array value"))))
        (define replacement-path-segment (term (∈ [~ ,symbol])))
        (define kv-for-user-env (if make-unreadable?
                                    (term (,symbol := ,(make-array)))
                                    (term (,symbol := ,(make-array #:must-include-val path-segment-symbol)))))
        (values replacement-path-segment kv-for-user-env))

      ; replace a single path segment by a "*" wildcard
      (define (mutate-* path-segment make-unreadable?)
        (values WILDCARD-PATH-EXPRESSION #f))

      ; list all possible wildcard mutate procedures. Include "mutate-*" thrice to generate more wildcards.
      (define mutations (list mutate-* mutate-= mutate-* mutate-∈ mutate-*))


      ; potentially transform a path segment into a random wildcard
      (define (path-segment->key-or-path-expression path-segment)
        ; replace only keys, not path expressions that already exist
        (if (redex-match? JsonLang k path-segment)
            (let ((replace-with-path-expression? (= path-expression-ctr path-expression-every)))
              (set! path-expression-ctr (modulo (+ path-expression-ctr 1) (+ path-expression-every 1)))
              
              (if replace-with-path-expression?
                  (let ((mutate (list-ref mutations mutate-ctr))
                        (make-unreadable? (= unreadable-ctr unreadable-every)))
                    (set! mutate-ctr (modulo (+ mutate-ctr 1) (length mutations)))
                    (set! unreadable-ctr (modulo (+ unreadable-ctr 1) (+ unreadable-every 1)))
                    
                    (when (and make-unreadable? (not (eq? mutate mutate-*)))
                      (set! paths-excluded-from-user-env (cons path paths-excluded-from-user-env)))
                    (define-values (replacement-path-segment kv-for-user-env?)
                      (mutate path-segment make-unreadable?))
                    (when kv-for-user-env?
                      ;(println kv-for-user-env?)
                      (set! user-environment (term (json-write ,user-environment ((kv-key ,kv-for-user-env?)) (kv-value ,kv-for-user-env?)))))
                    replacement-path-segment)
                  path-segment))
            path-segment))

      (define (maybe-invent-new-path! path-expression flat-path position)
        (define invented-path
          (cond ((eq? path-expression WILDCARD-PATH-EXPRESSION) (list-set flat-path position (gensym)))
                (else #f)))
        (when invented-path
          (set! newly-invented-paths (cons invented-path newly-invented-paths))))

      (define (maybe-unionify path)
        (define should-use-union? (= union-ctr use-union-every))

        (set! union-ctr (modulo (+ union-ctr 1) (+ use-union-every 1)))
        
        (if should-use-union?
            (let ((union-candidate (findf (lambda (union-candidate)
                                            (list-prefix? (UnionCandidate-replaced-path union-candidate) path))
                                          union-candidates)))
              (if union-candidate
                  (let ((result (list-set path (length (UnionCandidate-path-prefix union-candidate)) (UnionCandidate-path-expression union-candidate))))
                    result)
                  path))
            path))
                                        

      (define maybe-unionified-path (maybe-unionify path))
      (define path-selector
        (for/list ([position (in-range 0 (length maybe-unionified-path))])
          (define path-prefix (take path position))
          (define value-at-path-prefix (term (json-read-existing-path ,object ,path-prefix)))
          ; check if the value at the current path from the root is an array,
          ; if yes, definitely replace that value in the path with a wildcard
          (if (redex-match? JsonLang arr (term ,value-at-path-prefix))
              ARRAY-WILDCARD-PATH-EXPRESSION
              (let* ((current-path-key (list-ref maybe-unionified-path position))
                     (replacement-expression (path-segment->key-or-path-expression current-path-key)))
                ; not: maybe invent a new path based on the _original_ path (!). This is because the invented path is expected to be flat,
                ; rather than a path selector
                (when (redex-match? JsonLang ak (term ,replacement-expression))
                  (error "replacement expression matches ak term"))
                
                (maybe-invent-new-path! replacement-expression path position)
                replacement-expression))))
      path-selector)
 

    (define path-selectors (map path->path-selector paths))
    (values path-selectors user-environment paths-excluded-from-user-env newly-invented-paths))

  (define object (GeneratedObject-object generated-object))
  (define union-candidates (GeneratedObject-union-candidates generated-object))
  (define all-paths (get-all-paths object))
  (define-values (path-selectors user-environment paths-excluded-from-user-env newly-invented-paths) (expressionify-paths all-paths union-candidates object))
  (GeneratedPaths path-selectors user-environment paths-excluded-from-user-env newly-invented-paths))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Generate a privilege                                    ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define/contract (gen:READ-privilege generated-path-selectors)
  (-> (listof path-selector?) gen?)
  (gen:let ([path-selector (gen:one-of generated-path-selectors)])
           (term (ALLOW ,path-selector))))

(define/contract (gen:privilege generated-path-selectors)
  (-> (listof path-selector?) gen?)
  
  (gen:READ-privilege generated-path-selectors))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Generate a security policy                              ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(struct SecurityPolicy (generated-paths privileges) #:transparent)

(define/contract (gen:security-policy generated-object #:max-length [max-len 10] #:privilege-generator [gen:privilege gen:privilege])
  (->* [GeneratedObject?] [#:max-length exact-nonnegative-integer? #:privilege-generator (-> (listof path-selector?) gen?)] gen?)

  (define generated-paths (make-path-selectors generated-object))
  (define generated-path-selectors (GeneratedPaths-path-selectors generated-paths))
  
  
  (gen:let ([privileges (if (empty? generated-path-selectors)
                            (gen:const '())
                            (gen:list (gen:privilege generated-path-selectors) #:max-length max-len))])
           (SecurityPolicy generated-paths (remove-duplicates privileges))))

(define/contract (gen:non-empty-security-policy generated-object #:max-length [max-len 10] #:privilege-generator [gen:privilege gen:privilege])
  (->* [non-empty-GeneratedObject?] [#:max-length exact-nonnegative-integer? #:privilege-generator (-> (listof path-selector?) gen?)] gen?)

  ;(println generated-object)
  (gen:filter (gen:security-policy generated-object #:max-length max-len #:privilege-generator gen:privilege)
              (lambda (generated-security-policy)
                (define all-privileges (SecurityPolicy-privileges generated-security-policy))
                ;(print "all-privileges")
                ;(println all-privileges)
                (not (empty? all-privileges)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Generate permitted operations for a user                ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(define (make-paths-that-could-exist object privileges user-env)
  (define (get-complete-path-selector privilege)
    (match privilege
      [(list 'ALLOW path-selector)
       path-selector]
      [else (error "non-matching path selector")]))

  (define (invent-flattened-path path-selector)
    (define (flatten-path-expression path-expression)
      ; (p-exp ::= k * [script-op (~ k ...)] [script-op k] [∪ k ...])
      (match path-expression
        [(quote *)
         (generate-term JsonLang ok 2)]
        [(list script-op _)
         (generate-term JsonLang ok 2)]
        [(list '∪ k ...)
         (generate-term JsonLang ok 2)]
        [k k]))
    (map flatten-path-expression path-selector))
         
      

  (define all-path-selectors (map get-complete-path-selector privileges))
  (define flattened-path-selectors (map invent-flattened-path all-path-selectors))
  (define paths-that-could-exist flattened-path-selectors)

  (define all-paths (get-all-paths object))
  (define path-prefixes (map (lambda (path)
                               (if (not (empty? path))
                                   (drop-right path 1)
                                   path))
                             all-paths))
  paths-that-could-exist)




;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Generate a possible user environment for a user         ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define/contract (gen:user-env security-policy)
  (-> SecurityPolicy? gen?)
  
  (let* ((possible-user-env (GeneratedPaths-user-env (SecurityPolicy-generated-paths security-policy))))
    (if (empty? possible-user-env) (gen:const '(O)) (gen:const possible-user-env))))


; Debugging code

#;(define gen:debug (gen:let ([obj gen:object]
                              [security-policy (gen:security-policy obj '(A) #:privilege-generator gen:READ-privilege)])
                             (pretty-print obj)
                             (pretty-print security-policy)
                             (pretty-print (collect-all-privileges security-policy))
                             (displayln "###############################################")))
