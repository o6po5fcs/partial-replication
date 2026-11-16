#lang racket


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;                                                                  ;;;
;;; Auxiliary functions for manipulating terms                       ;;;
;;;                                                                  ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(require redex/reduction-semantics
         (only-in "../formalism/JsonLang.rkt"
                  value-to-paths
                  project
                  JsonLang)
         (only-in "../formalism/PolTreeLang.rkt"
                  PolTree-project
                  PolTreeLang)
         )


(provide
 get-all-paths
 privilege-get-path-selector
 JsonLang-get-δ-path
 JsonLang-project-json
 PolTreeLang-project-json
 )

(define DEBUG_TESTS #t)




(define (get-all-paths object)
  (term (value-to-paths ,object)))

(define (privilege-get-path-selector privilege)
  (if (redex-match? JsonLang priv (term ,privilege))
      (last privilege)
      (error "given term does not match the 'priv' term" privilege)))



(define (JsonLang-get-δ-path δ)
  (cadr δ))

(define (JsonLang-project-json json privileges env)
  (when DEBUG_TESTS
    (unless (redex-match? JsonLang obj (term ,json))
      (error "'json' does not match the 'obj' term" json))

    (unless (redex-match? JsonLang (priv ...) (term ,privileges))
      (error "'privileges' does not match the '(priv ...)' term" privileges))

    (unless (redex-match? JsonLang obj (term ,env))
      (error "'env' does not match the 'obj' term" env))
    )
  
  (term (project ,json ,privileges ,json ,env ())))

(define (PolTreeLang-project-json json tree env)
  (when DEBUG_TESTS
    (unless (redex-match? PolTreeLang obj (term ,json))
      (error "'json' does not match the 'obj' term" json))

    (unless (redex-match? PolTreeLang tree (term ,tree))
      (error "'tree' does not match the 'tree' term" tree))

    (unless (redex-match? PolTreeLang obj (term ,env))
      (error "'env' does not match the 'obj' term" env))
    )
  
  (term (PolTree-project ,json ,tree ,env ())))