#lang racket

(require redex/reduction-semantics
         rackunit
         racket/pretty
         racket/set
         rackcheck
         "../formalism/JsonLang.rkt"
         "../formalism/PolTreeLang.rkt"
         "generators.rkt"
         "./helpers.rkt")

(provide check-projection-equivalence
         check-projection-confidentiality
         check-shard-query-PolTree-equivalence
         check-PolTree-migration-remove-correctness
         check-PolTree-migration-add-correctness
         )

(define VERBOSE_LOGGING? #f)

(define projection-equivalence
  (let ((attempt 1))
    (property projection-equivalence
              (; Generate an object
               [generated-object gen:object]
               ; Generate a security policy for said object
               [shard-query (gen:security-policy generated-object)]
               ; Generate a user environment based on the security policy
               [user-env (gen:user-env shard-query)]
               )
              (let* (; extract the JsonLang object from the GeneratedObject struct
                     (object (GeneratedObject-object generated-object))
                     ; Get a list of privileges from the security policy
                     (all-privileges (SecurityPolicy-privileges shard-query))
                     (poltree (term (make-PolTree ,all-privileges)))
                     )
                (displayln (format "##################### attempt ~a #####################" attempt))
                (set! attempt (+ attempt 1))

                (when VERBOSE_LOGGING?
                  (displayln "Generated user-env:")
                  (pretty-print user-env)

                  (displayln "Generated object:")
                  (pretty-print object)

                  (displayln "Generated shard query:")
                  (pretty-print all-privileges))

                (define all-paths (get-all-paths object))
                (label! (case all-paths
                          ['() "empty object"]
                          [else
                           (let ((obj-depth (apply max (map length all-paths))))
                             (if (= 1 obj-depth)
                                 (format "~a level deep" obj-depth)
                                 (format "~a levels deep" obj-depth)))]))
                

                (define jsonlang-projected-object (JsonLang-project-json object all-privileges user-env))
                (define poltreelang-projected-object (PolTreeLang-project-json object poltree user-env))

                (when VERBOSE_LOGGING?
                  (displayln "JsonLang projected object:")
                  (pretty-print jsonlang-projected-object)
                  (displayln "PolTreeLang projected object:")
                  (pretty-print poltreelang-projected-object))
                
                (define paths-in-jsonlang-projection (get-all-paths jsonlang-projected-object))
                (define paths-in-poltreelang-projection (get-all-paths poltreelang-projected-object))
                                  
                              
                (check-equal? paths-in-poltreelang-projection paths-in-jsonlang-projection)))))


(define projection-confidentiality
  (let ((attempt 1))
    (property projection-confidentiality 
              (; Generate an object
               [generated-object gen:object]
               ; Generate a security policy for said object
               [shard-query (gen:security-policy generated-object)]
               ; Generate a user environment based on the security policy
               [user-env (gen:user-env shard-query)]
               )
              (let* (; extract the JsonLang object from the GeneratedObject struct
                     (object (GeneratedObject-object generated-object))
                     ; Get a list of privileges from the security policy
                     (all-privileges (SecurityPolicy-privileges shard-query))
                     )
                (displayln (format "##################### attempt ~a #####################" attempt))
                (set! attempt (+ attempt 1))

                (when VERBOSE_LOGGING?
                  (displayln "Generated user-env:")
                  (pretty-print user-env)

                  (displayln "Generated object:")
                  (pretty-print object)

                  (displayln "Generated shard query:")
                  (pretty-print all-privileges))

                (define all-paths (get-all-paths object))
                (label! (case all-paths
                          ['() "empty object"]
                          [else
                           (let ((obj-depth (apply max (map length all-paths))))
                             (if (= 1 obj-depth)
                                 (format "~a level deep" obj-depth)
                                 (format "~a levels deep" obj-depth)))]))
                

                (define projected-object (JsonLang-project-json object all-privileges user-env))

                (when VERBOSE_LOGGING?
                  (displayln "Projected object:")
                  (pretty-print projected-object))
                
                ; Collect all paths contained within the user's projected data
                (define paths-in-projection (get-all-paths projected-object))

                (define paths-that-should-be-visible
                  (filter (lambda (path) (term (is-readable ,path ,all-privileges ,user-env)))
                          all-paths))

                  
                (when VERBOSE_LOGGING?
                  (displayln "Paths in projected object:")
                  (pretty-print paths-in-projection)

                  (displayln "Paths that should be visible:")
                  (pretty-print paths-that-should-be-visible))
                
                (check-equal? paths-in-projection paths-that-should-be-visible)))))





(define shard-query-PolTree-equivalence
  (let ((attempt 1))
    (property security-policy-PolTree-equivalence 
              (; Generate an object
               [generated-object gen:object]
               ; Generate a security policy for said object
               [shard-query (gen:security-policy generated-object)]
               ; Generate a user environment based on the security policy
               [user-env (gen:user-env shard-query)]
               )
              (let* (; extract the JsonLang object from the GeneratedObject struct
                     (object (GeneratedObject-object generated-object))
                     ; Get a list of privileges from the security policy
                     (all-privileges (SecurityPolicy-privileges shard-query))
                     (NPolTree (term (make-PolTree ,all-privileges))))
                (displayln (format "##################### attempt ~a #####################" attempt))
                (set! attempt (+ attempt 1))

                (when VERBOSE_LOGGING?
                  (display "attempt: ") (displayln attempt)
                  (displayln "Generated user-env:")
                  (pretty-print user-env)

                  (displayln "Generated object:")
                  (pretty-print object)

                  (displayln "Generated shard query:")
                  (pretty-print all-privileges))
                
                (define all-paths (get-all-paths object))
                (label! (case all-paths
                          ['() "empty object"]
                          [else
                           (let ((obj-depth (apply max (map length all-paths))))
                             (if (= 1 obj-depth)
                                 (format "~a level deep" obj-depth)
                                 (format "~a levels deep" obj-depth)))]))                

                (for ([path all-paths])
                  (define naive-access-decision (judgment-holds (is-readable ,path ,all-privileges ,user-env)))
                  (define poltree-access-decision (judgment-holds (is-PolTree-readable ,NPolTree ,path ,user-env)))

                  (label! (if naive-access-decision
                              "path is readable under security policy"
                              "path is not readable under security policy"))
                  
                  (when VERBOSE_LOGGING?
                    (printf "checking path ~a -> is-readable? ~a, is-PolTree-readable? ~a\n" path naive-access-decision poltree-access-decision)
                    )

                  (check-equal? poltree-access-decision naive-access-decision))))))


(define PolTree-migration-remove-correctness
  (let ((attempt 1))
    
    (property PolTree-migration-remove-correctness 
              (; Generate an object
               [generated-object gen:non-empty-object]
               ; Generate a security policy for said object
               [shard-query (gen:non-empty-security-policy generated-object)]
               ; Select a privilege to remove from the security policy
               [privilege-to-remove (gen:one-of (SecurityPolicy-privileges shard-query))]
               ; Generate a user environment based on the security policy
               [user-env (gen:user-env shard-query)])
              (let* (
                     (object (GeneratedObject-object generated-object))
                     ; Collect a list of all privileges that were generated
                     (original-privileges (SecurityPolicy-privileges shard-query))
                     (modified-privileges (remove privilege-to-remove original-privileges))
                      
                     ; Build an NPolTree from the original security policy
                     (original-PolTree (term (make-PolTree ,original-privileges)))
                     (modified-PolTree (term (make-PolTree ,modified-privileges)))

                     ; compute a shard from the original security policy
                     (original-shard (term (make-shard ,object ,original-privileges ,user-env)))
                     ; compute a shard from the modified security policy
                     (modified-shard (term (make-shard ,object ,modified-privileges ,user-env)))
                     ; compute a migration by comparing the original shard and the modified shard
                     (naive-shard-migration (term (migrate-naive ,original-shard ,modified-shard ())))

                     (removed-privilege-path-selector (privilege-get-path-selector privilege-to-remove))
                     (PolTree-migration (term (migrate-del ,original-shard ,modified-PolTree ,user-env ,removed-privilege-path-selector ())))
                     )
                (displayln (format "##################### attempt ~a #####################" attempt))
                (set! attempt (+ attempt 1))

                (define migration-size (length naive-shard-migration))

                (label! (case migration-size
                          ['() "empty migration"]
                          [else
                           (if (= 1 migration-size)
                               (format "~a change" migration-size)
                               (format "~a changes" migration-size))]))

                (when VERBOSE_LOGGING?

                  (display "attempt: ") (displayln attempt)
                  (displayln "Generated user-env:")
                  (pretty-print user-env)
                    
                  (displayln "Generated object:")
                  (pretty-print object)

                  (displayln "Original shard:")
                  (pretty-print original-shard)

                  (displayln "Modified shard:")
                  (pretty-print modified-shard)

                  (displayln "Removed privilege path selector:")
                  (pretty-print removed-privilege-path-selector)

                  (displayln "Generated original shard query:")
                  (pretty-print original-privileges)

                  (displayln "Selected privilege to remove:")
                  (pretty-print privilege-to-remove)

                  (displayln "Modified security policy:")
                  (pretty-print modified-privileges)

                  (displayln "Original PolTree:")
                  (pretty-print original-PolTree)
                  
                  (displayln "Modified PolTree:")
                  (pretty-print modified-PolTree)

                  (displayln "Naive migration:")
                  (pretty-print naive-shard-migration)

                  (displayln "Poltree migration:")
                  (pretty-print PolTree-migration)
                  )
                
                (check-equal? PolTree-migration naive-shard-migration)))))


(define PolTree-migration-add-correctness
  (let ((attempt 1))
    
    (property PolTree-migration-add-correctness
              (; Generate an object
               [generated-object gen:non-empty-object]
               ; Generate a security policy for said object
               [shard-query (gen:non-empty-security-policy generated-object)]
               ; Select a privilege to add to the security policy
               [privilege-to-add (gen:one-of (SecurityPolicy-privileges shard-query))]
               ; Generate a user environment based on the security policy
               [user-env (gen:user-env shard-query)])
              (let* ((object (GeneratedObject-object generated-object))
                     ; Collect a list of all privileges that were generated
                     (modified-privileges (SecurityPolicy-privileges shard-query))
                     (original-privileges (remove privilege-to-add modified-privileges))
                     

                           
                     ; Build an NPolTree from the original security policy
                     (original-PolTree (term (make-PolTree ,original-privileges)))
                     (modified-PolTree (term (make-PolTree ,modified-privileges)))

                     ; compute a shard from the original security policy
                     (original-shard (term (make-shard ,object ,original-privileges ,user-env)))
                     ; compute a shard from the modified security policy
                     (modified-shard (term (make-shard ,object ,modified-privileges ,user-env)))
                     ; compute a migration by comparing the original shard and the modified shard
                     (naive-shard-migration (term (migrate-naive ,original-shard ,modified-shard ())))

                     (added-privilege-path-selector (privilege-get-path-selector privilege-to-add))
                     (PolTree-migration (term (migrate-add ,object ,original-shard ,user-env ,added-privilege-path-selector ())))
                     (PolTree-migration-outcome (term (json-apply-ops ,original-shard ,PolTree-migration)))
                     )
                (displayln (format "##################### attempt ~a #####################" attempt))
                (set! attempt (+ attempt 1))

                (define migration-size (length naive-shard-migration))
                (define all-paths (get-all-paths object))
                (label! (format "migration size ~a" migration-size))

                (when VERBOSE_LOGGING?

                  (display "attempt: ") (displayln attempt)
                  (displayln "Generated user-env:")
                  (pretty-print user-env)
                    
                  (displayln "Generated object:")
                  (pretty-print object)

                  (displayln "Original shard:")
                  (pretty-print original-shard)

                  (displayln "Modified shard:")
                  (pretty-print modified-shard)

                  (displayln "Added privilege path selector:")
                  (pretty-print added-privilege-path-selector)

                  (displayln "Generated original shard query:")
                  (pretty-print original-privileges)

                  (displayln "Selected privilege to add")
                  (pretty-print privilege-to-add)

                  (displayln "Modified security policy:")
                  (pretty-print modified-privileges)

                  (displayln "Original PolTree:")
                  (pretty-print original-PolTree)
                  
                  (displayln "Modified PolTree:")
                  (pretty-print modified-PolTree)

                  (displayln "Naive migration:")
                  (pretty-print naive-shard-migration)

                  (displayln "Poltree migration:")
                  (pretty-print PolTree-migration)

                  (displayln "Poltree migration outcome:")
                  (pretty-print PolTree-migration-outcome)
                  (displayln "Modified shard:")
                  (pretty-print modified-shard)
                  )
                
                (check-equal? (list->set (get-all-paths PolTree-migration-outcome)) (list->set (get-all-paths modified-shard)))))))


(define (check-projection-equivalence nr-of-tests)
  (check-property (make-config #:tests nr-of-tests #:deadline +inf.0) projection-equivalence))

(define (check-projection-confidentiality nr-of-tests)
  (check-property (make-config #:tests nr-of-tests #:deadline +inf.0) projection-confidentiality))

(define (check-shard-query-PolTree-equivalence nr-of-tests)
  (check-property (make-config #:tests nr-of-tests #:deadline +inf.0) shard-query-PolTree-equivalence))

(define (check-PolTree-migration-remove-correctness nr-of-tests)
  (check-property (make-config #:tests nr-of-tests #:deadline +inf.0) PolTree-migration-remove-correctness))

(define (check-PolTree-migration-add-correctness nr-of-tests)
  (check-property (make-config #:tests nr-of-tests #:deadline +inf.0) PolTree-migration-add-correctness))


(define/contract (errortrace->struct symb)
  (-> symbol? any)

  (define (lst->GeneratedPaths lst)
    (match lst
      [(list 'GeneratedPaths path-selectors user-env paths-excluded-from-user-env newly-invented-paths)
       (GeneratedPaths path-selectors user-env paths-excluded-from-user-env newly-invented-paths)]))

  (define (lst->UnionCandidate lst)
    (match lst
      [(list 'UnionCandidate replaced-path path-prefix path-expression)
       (UnionCandidate replaced-path path-prefix path-expression)]))

  (define (lst->SecurityPolicy lst)
    (match lst
      ([list 'SecurityPolicy generated-paths privileges]
       (SecurityPolicy (lst->GeneratedPaths generated-paths) privileges))
      (else (pretty-print lst))))

  
  (define str (symbol->string symb))
  (set! str (string-replace str "(#(struct:" "((" #:all? #t))
  (set! str (string-replace str "#(struct:" "(" #:all? #t))

  (define expr (read (open-input-string str)))
  (match expr
    [(list 'GeneratedObject object union-candidates)
     (GeneratedObject (term ,object) (map lst->UnionCandidate union-candidates))]
    [(list 'SecurityPolicy generated-paths privileges)
     (lst->SecurityPolicy expr)]
    [else (match (car expr)
            (else expr))]))


;(check-projection-equivalence 10)
;(check-projection-confidentiality 10)
;(check-shard-query-PolTree-equivalence 10)
;(check-PolTree-migration-remove-correctness 10)
;(check-PolTree-migration-add-correctness 10)

; Example:
; (errortrace->struct '|#(struct:GeneratedObject ((䀐 := ((2 := ((0 := 0))) (0 := #t))) (2 := ((1 := #t) (a := 0) (0 := 0))) (0 := #t) (1 := ((0 := 0))) (a := "W") (g168182 := ((0 := 0)))) (#(struct:UnionCandidate (1) () (∪ 1 g168182))))|)