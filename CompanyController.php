<?php

namespace Api;

use \Company;
use \Contact;
use \Address;
use \Response;
use \Log;
use \CustomerType;
use \ShippingMethod;
use \State;
use \PhoneNumber;
use \Input;
use \Validator;
use \Schema;
use \App;

class CompanyController extends \Api\BaseController
{
	public function getIndex($companyId)
	{
		$company = Company::find($companyId);

		if(!$company instanceof Company) {
		    Log::error("Could not find company with ID $companyId");
			return Response::json('Company not found', 404);
		}

		return Response::json($company);
	}

	public function getContacts($companyId)
	{
		$company = Company::find($companyId);

		if(!$company instanceof Company) {
		    Log::error("Could not find company with ID $companyId");
			return Response::json('Company not found', 404);
		}

		$company->contacts->load('emails');
		$company->contacts->load('phoneNumbers');

        //add company id to contact data
        foreach($company->contacts as $contact){
            $contact->company_id = $companyId;
        }

		return Response::json($company->contacts->toArray());
	}

	public function all(){

		$companies = Company::all();

		return Response::json($companies);
	}

    public function getFabrics($companyId){

        $company = Company::find($companyId);

        if(!$company instanceof Company) {
            Log::error("Could not find company with ID $companyId");
            return Response::json('Company not found', 404);
        }

        $fabrics = $company->fabrics;
        foreach($fabrics as $fabric){
            $fabric->name = $fabric->getNameAttribute();
        }

        return Response::json($fabrics);
    }

    //return an object with all the select options available to companies
	public function selectOptions(){

		$options = new \stdClass();

		$options->credit_terms = Company::getCreditTerms();
		$options->customer_types = CustomerType::all()->toArray();
		$options->shipping_methods = ShippingMethod::all()->toArray();
		$options->states = State::getStatesList();
		$options->phone_types = PhoneNumber::getTypes(true);

		return Response::json($options);
	}

	public function putIndex($companyId)
    {
        $data = Input::all();

        //validate the data
        $validator = Validator::make(
        	$data,
            Company::getValidationRules()
        );
        if($validator->fails()) {
            return Response::json($validator->errors(), 422);
        }

        //find or create a company
        if(isset($data['id'])) {
            $company = Company::find($data['id']);
        } else {
        	$company = new Company;
        }

        if(!$company instanceof Company) {
        	return Response::json("Company not found.", 410);
        }

        //update and save the company
        $company->name = Input::get('name');
        $company->credit_terms = Input::get('credit_terms');
        $company->customer_type_id = Input::get('customer_type_id');
        $company->account_no = Input::get('account_no');
        $company->credit_term_notes = Input::get('credit_term_notes');
        $company->notes = Input::get('notes');
        $company->primary_billing_address_id = Input::get('primary_billing_address_id');
        $company->primary_shipping_address_id = Input::get('primary_shipping_address_id');
        $company->website = Input::get('website');
        $company->save();
        
        return Response::json($company->toArray());
    }

    //find the model structure of a company
    public function newCompany(){

    	$companyFields = Schema::getColumnListing('companies');

    	$newCompany = new Company;
    	foreach($companyFields as $field){
    		$newCompany->{$field} = null;
    	}
        $newCompany->updated_at = date('Y-m-d H:i:s',time());

    	return Response::json($newCompany);
    }

    public function deleteIndex($id){ 
    	$company = Company::findOrFail($id);
        $company->delete();
        
        return Response::json($company->name ."Deleted");
    }

    //Address methods
    public function getAddressAll($companyId){
    	//yet another get address endpoint in addition to the one above - getAddresses()
        //not happy about having two, but the other one is doing legacy stuff with the phone and returning as an object, not an array

    	$company = Company::find($companyId);

    	if(!$company instanceof Company) {
    	    Log::error("Could not find company with ID $companyId");
    		return Response::json('Company not found', 404);
    	}

        //grab the state options
        foreach($company->addresses as $address){
            $address->setStatesSelectOptions();
            $address->shippingMethods();
        }

    	return Response::json($company->addresses->toArray());
    }

    //return the model structure of an address
    public function getNewAddress(){
    	$addressFields = Schema::getColumnListing('addresses');

    	$newAddress = new Address;
    	foreach($addressFields as $field){
    		$newAddress->{$field} = null;
    	}

        $newAddress->setStatesSelectOptions();
        $newAddress->shippingMethods();
        $newAddress->updated_at = date('Y-m-d H:i:s',time());

    	return Response::json($newAddress);
    }

	public function putAddress($companyId)
    {
        $data = Input::all();

        //validate the data
        $validator = Validator::make(
        	$data,
            Address::getValidationRules()
        );
        if($validator->fails()) {
            return Response::json($validator->errors(), 422);
        }

        //make sure the company exists
        if(isset($companyId)) {
            $company = Company::find($companyId);
        }
        if(!$company instanceof Company) {
        	return Response::json("Company not found.", 410);
        }

        //make sure the address exists; if not, create a new one
        if(isset($data['id'])) {
            $address = Address::find($data['id']);
        } else {
        	$address = new Address;
        }
        if(!$address instanceof Address) {
        	return Response::json("Address not found.", 410);
        }

        //update and save the address
        $address->address1 = (Input::get('address1') !== '')? Input::get('address1'): null;
        $address->address2 = (Input::get('address2') !== '')? Input::get('address2'): null;
        $address->city = (Input::get('city') !== '')? Input::get('city'): null;
        $address->state = (Input::get('state') !== '')? Input::get('state'): null;
        $address->zip = (Input::get('zip') !== '')? Input::get('zip'): null;
        $address->company_id = (Input::get('company_id') !== '')? Input::get('company_id'): null;
        $address->area = (Input::get('area', '') !== '')? Input::get('area', ''): null;
        $address->shipping_method_id = (Input::get('shipping_method_id') !== '')? Input::get('shipping_method_id'): null;
        $address->save();
        
        return Response::json($address->toArray());
    }

    public function deleteAddress($companyId, $addressId){ 
    	$address = Address::find($addressId);

    	if(!$address instanceof Address) {
    		App::abort(404, 'Cannot Remove: address with id ' . $addressId . ' not found.');
    	}
        $address->delete();
        
        return Response::json($address->address1 ." Deleted");
    }

    //contact methods
    //return the model structure of a contact
    public function getNewContact(){
    	$contactFields = Schema::getColumnListing('contacts');

    	$newContact = new Contact;
    	foreach($contactFields as $field){
    		$newContact->{$field} = null;
    	}
        $newContact->updated_at = date('Y-m-d H:i:s',time());

    	return Response::json($newContact);
    }

    public function putContact($companyId, $contactId){
        $data = Input::all();

        //validate the data
        $validator = Validator::make(
            $data,
            Contact::getValidationRules()
        );
        if($validator->fails()) {
            return Response::json($validator->errors(), 422);
        }

        //make sure the company exists
        if(isset($companyId)) {
            $company = Company::find($companyId);
        }
        if(!$company instanceof Company) {
            return Response::json("Company not found.", 410);
        }

        //make sure the contact exists; if not, create a new one
        if(isset($data['id'])) {
            $contact = Contact::find($data['id']);
        } else {
            $contact = new Contact;
        }
        if(!$contact instanceof Contact) {
            return Response::json("Contact not found.", 410);
        }

        //update and save the contact info
        $contact->first_name = Input::get('first_name');
        $contact->last_name = Input::get('last_name');
        $contact->primary_email_id = Input::get('primary_email_id');
        $contact->primary_phone_number_id = Input::get('primary_phone_number_id');
        $contact->title = Input::get('title');
        $contact->notes = Input::get('notes');
        $contact->save();

        //if is not associated, associate
        $isAssociated = ($company->contacts()->where('id','=',$contact->id)->count() > 0);
        if(!$isAssociated){
            $company->contacts()->save($contact);
        }
        return Response::json($contact->toArray());
    }

    public function deleteContact($companyId, $contactId){ 
        $contact = Contact::find($contactId);

        if(!$contact instanceof Contact) {
            App::abort(404, 'Cannot Remove: contact with id ' . $contactId . ' not found.');
        }
        $contact->delete();
        
        return Response::json($contact->first_name . " " . $contact->last_name ." Deleted");
    }
}
